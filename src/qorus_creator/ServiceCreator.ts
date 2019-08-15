import { window, Position } from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { qorus_webview } from '../QorusWebview';
import { InterfaceCreator } from './InterfaceCreator';
import { fillTemplate } from './creator_common';
import { service_class_template, service_method_template } from './service_code';
import { t } from 'ttag';
import * as msg from '../qorus_message';


class ServiceCreator extends InterfaceCreator {
    constructor() {
        super('.qsd');
    }

    edit(data: any, edit_type: string) {
        if (!data.methods || !data.methods.length) {
            data.methods = [{
                name: 'init',
                desc: t`DefaultInitMethodDesc`,
            }];
        }

        const other_data = this.init(data);
        const { methods, ...header_data } = other_data;

        const service_info = this.code_info.serviceInfo(this.file_path);
        const initial_data = qorus_webview.opening_data;

        let contents: string;
        let message: string;
        let code_lines: string[];
        switch (edit_type) {
            case 'edit':
                if (!initial_data.service) {
                    msg.error(t`MissingEditData`);
                    return;
                }
                const initial_methods: string[] = (initial_data.service.methods || []).map(method => method.name);
                const method_renaming_map = this.methodRenamingMap(initial_methods, methods);
                code_lines = service_info.text_lines;
                code_lines = this.renameClassAndBaseClass(code_lines, service_info, initial_data, header_data);
                code_lines = this.renameServiceMethods(code_lines, service_info, method_renaming_map.renamed);
                code_lines = this.removeServiceMethods(code_lines, service_info, method_renaming_map.removed);
                contents = this.addServiceMethods(code_lines, method_renaming_map.added);
                break;
            case 'create':
                contents = this.code(data, methods);
                message = t`2FilesCreatedInDir ${this.file_name} ${this.yaml_file_name} ${this.target_dir}`;
                break;
            case 'delete-method':
                if (typeof(data.method_index) === 'undefined') {
                    break;
                }
                const method_name = methods[data.method_index].name;
                code_lines = this.removeServiceMethods(service_info.text_lines, service_info, [method_name]);
                contents = code_lines.join('\n') + '\n';
                message = t`ServiceMethodHasBeenDeleted ${method_name}`;

                data.methods.splice(data.method_index, 1);

                data.active_method = data.methods.length - 1;
                delete data.method_index;
                delete data.servicetype;
                delete data.yaml_file;

                break;
            default:
                msg.error(t`UnknownEditType`);
                return;
        }

        const headers_begin = { type: 'service' };
        const headers_end = {
            servicetype: 'USER',
            code: this.file_name,
        };

        const headers = ServiceCreator.createHeaders(Object.assign(headers_begin, header_data, headers_end));

        this.writeFiles(contents, headers + ServiceCreator.createMethodHeaders(data.methods));

        if (message) {
            msg.info(message);
        }

        qorus_webview.opening_data = {
            tab: 'CreateInterface',
            subtab: 'service',
            service: data
        };

        if (initial_data.service && initial_data.service.target_dir && initial_data.service.target_file) {
            const orig_file = path.join(initial_data.service.target_dir, initial_data.service.target_file);

            if (orig_file === this.file_path) {
                return;
            }

            const yaml_info = this.code_info.yaml_info_by_file[orig_file];
            const orig_yaml_file = yaml_info && yaml_info.yaml_file;

            for (const file of [orig_file, orig_yaml_file]) {
                if (!file) {
                    continue;
                }
                fs.unlink(file, err => {
                    if (err) {
                        msg.error(t`RemoveFileError ${file} ${err.toString()}`);
                    }
                    else {
                        msg.info(t`OrigFileRemoved ${file}`);
                    }
                });
            }
        }
    }

    private methodRenamingMap(orig_names: string[], new_methods: any[]): any {
        let mapping: any = {
            added: [],
            removed: [],
            unchanged: [],
            renamed: {}
        };
        let names = {};
        for (let method of new_methods) {
            names[method.name] = true;

            if (method.name === method.orig_name) {
                mapping.unchanged.push(method.name);
            }
            else {
                if (method.orig_name) {
                    mapping.renamed[method.orig_name] = method.name;
                }
                else {
                    mapping.added.push(method.name);
                }
            }
        }

        for (let name of orig_names) {
            if (name && !names[name] && !mapping.renamed[name]) {
                mapping.removed.push(name);
            }
        }

        return mapping;
    }

    private renameClassAndBaseClass(lines: string[], service_info: any, initial_data: any, header_data): string[] {
        const {
            class_name: orig_class_name,
            base_class_name: orig_base_class_name
        } = initial_data.service;
        const { class_name, base_class_name } = header_data;

        const replace = (position: Position, orig_name: string, name: string) => {
            let chars = lines[position.line].split('');
            chars.splice(position.character, orig_name.length, name);
            lines[position.line] = chars.join('');
        }

        if (base_class_name !== orig_base_class_name) {
            replace(service_info.base_class_name_range.start, orig_base_class_name, base_class_name);
        }
        if (class_name !== orig_class_name) {
            replace(service_info.class_name_range.start, orig_class_name, class_name);
        }
        return lines;
    }

    private renameServiceMethods(lines: string[], service_info: any, renaming: any): string[] {
        let lines_with_renaming = {};
        for (const name of Object.keys(renaming)) {
            const range = service_info.method_name_ranges[name];
            if (!lines_with_renaming[range.start.line]) {
                lines_with_renaming[range.start.line] = {};
            }
            lines_with_renaming[range.start.line][range.start.character] = name;
        }

        let n = -1;
        return lines.map(line => {
            if (!lines_with_renaming[++n]) {
                return line;
            }

            for (const start of Object.keys(lines_with_renaming[n]).map(key => parseInt(key)).sort((a: any, b: any) => b - a)) {
                const name = lines_with_renaming[n][start];
                let chars = line.split('');
                chars.splice(start, name.length, renaming[name]);
                line = chars.join('');
            }
            return line;
        });
    }

    private removeServiceMethods(lines: string[], service_info: any, removed: string[]): string[] {
        const removeRange = (lines, range) => {
            let rows = [];
            for (let i = 0; i < range.start.line; i++) {
                rows.push(lines[i]);
            }
            rows.push(lines[range.start.line].substr(0, range.start.character));
//            rows.push(lines[range.end.line].substr(range.end.character).trim());
            for (let i = range.end.line + 1; i < lines.length; i++) {
                rows.push(lines[i]);
            }
            return rows;
        }

        let rangesToRemove = removed.map(name => service_info.method_decl_ranges[name]);
        while (rangesToRemove.length) {
            lines = removeRange(lines, rangesToRemove.pop())
        }
        return lines;
    }

    private addServiceMethods(lines: string[], added: string[]): string {
        while (lines[lines.length - 1].trim() === '') {
            lines.pop();
        }
        let code = lines.splice(0, lines.length - 1).join('\n') + '\n';
        for (let name of added) {
            code += '\n' + fillTemplate(service_method_template, this.lang, false, { name });
        }
        code += lines[0] + '\n';
        return code;
    }

    deleteMethod(data: any) {
        if (!data.methods || data.methods.length < 2) {
            msg.error(t`CannotDeleteTheOnlyOneServiceMethod`);
            return;
        }

        const deleted_method = data.methods && data.methods[data.method_index];
        if (!deleted_method) {
            msg.error(t`InvalidDeletedMethodIndex`);
            return;
        }

        window.showInformationMessage(
            t`ConfirmDeleteMethod ${deleted_method.name}`,
            t`ButtonDelete`,
            t`ButtonCancel`
        ).then(selection => {
            if (selection === t`ButtonCancel`) {
                return;
            }

            this.edit(data, 'delete-method');
        });
    }

    private code(data: any, method_objects: any[]): any {
        let method_strings = [];
        for (let method of method_objects) {
            method_strings.push(fillTemplate(service_method_template, this.lang, false, { name: method.name }));
        }
        const methods = method_strings.join('\n');

        return fillTemplate(service_class_template, this.lang, true, {
            class_name: data.class_name,
            base_class_name: data.base_class_name,
            methods
        });
    }

    protected static createMethodHeaders = (methods: any): string => {
        const list_indent = '  - ';
        const indent = '    ';
        let result: string = 'methods:\n';

        for (let method of methods) {
            result += `${list_indent}name: ${method.name}\n`
            for (let tag in method) {
                switch (tag) {
                    case 'name':
                    case 'orig_name':
                        break;
                    case 'author':
                        result += `${indent}author:\n`;
                        for (let author of method.author) {
                            result += `${indent}${list_indent}${author.name}\n`;
                        }
                        break;
                    default:
                        result += `${indent}${tag}: ${method[tag]}\n`
                }
            }
        }

        return result;
    }
}

export const service_creator = new ServiceCreator();