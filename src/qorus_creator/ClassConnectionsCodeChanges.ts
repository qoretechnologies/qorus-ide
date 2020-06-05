import * as fs from 'fs';
import { QorusProjectCodeInfo } from '../QorusProjectCodeInfo';
import { QorusProjectEditInfo } from '../QorusProjectEditInfo';
import { ClassConnections, GENERATED_TEXT, indent } from './ClassConnections';
import { InterfaceCreator } from './InterfaceCreator';
import { QoreTextDocument, qoreTextDocument } from '../QoreTextDocument';
import { simple_method_template } from './common_constants';
import { sortRanges } from '../qorus_utils';


export const classConnectionsCodeChanges = async (
    file,
    code_info: QorusProjectCodeInfo,
    new_data,
    orig_data,
    iface_kind,
    imports) =>
{
    const edit_info: QorusProjectEditInfo = code_info.edit_info;
    let edit_data;
    let lines;
    let method_names;
    let trigger_names;
    let more_imports = [];

    const data = {
        ...new_data,
        iface_kind
    };

    const mixed_data = {
        ...data,
        'class-connections': orig_data?.['class-connections']
    };

    const lang = data.lang || 'qore';
    const had_class_connections = Object.keys(orig_data?.['class-connections'] || {}).length > 0;
    const has_class_connections = Object.keys(data?.['class-connections'] || {}).length > 0;

    const setFileInfo = async (params, add_class_connections_info = false) => {
        return await edit_info.setFileInfo(file, params, add_class_connections_info);
    };

    const writeFile = lines => fs.writeFileSync(file, lines.join('\n') + '\n');

    // remove original class connections code
    if (had_class_connections) {
        edit_data = await setFileInfo(mixed_data, true);
        if (iface_kind === 'step') {
            trigger_names = code_info.triggers({iface_kind, 'base-class-name': orig_data['base-class-name']});
        }
        lines = removeClassConnectionsCode(edit_data, iface_kind, trigger_names);
        lines = cleanup(lines);
        writeFile(lines);

        if (iface_kind === 'step') {
            method_names = trigger_names;
        } else {
            ({ class_connections_trigger_names: method_names } = edit_data);
        }

        edit_data = await setFileInfo(data);
        if (edit_data.is_private_member_block_empty) {
            lines = deleteEmptyPrivateMemberBlock(edit_data);
            lines = cleanup(lines);
            writeFile(lines);
        }
    }

    // add new class connections code
    if (has_class_connections) {
        const class_connections = new ClassConnections({ ...data, iface_kind }, code_info, lang);
        let { imports: cc_imports, triggers, trigger_code, connections_extra_class } = class_connections.code();
        more_imports = cc_imports;
        trigger_names = triggers;

        edit_data = await setFileInfo(data);
        lines = removeMethods(trigger_names, edit_data);
        lines = cleanup(lines);
        writeFile(lines);

        edit_data = await setFileInfo(data);

        let line_shift;
        ({ lines, line_shift } = insertMemberDeclAndMaybeInit(class_connections, edit_data, lang));
        if (lang === 'java' && edit_data.constructor_range) {
            ({ lines, line_shift } = insertMemberInitJava(class_connections, edit_data, lines, line_shift));
        }
        lines = insertTriggerCode(trigger_code, edit_data, lines, line_shift);
        let extra_class_code_lines = connections_extra_class.split(/\r?\n/);
        extra_class_code_lines.pop();
        lines = [ ...lines, ...extra_class_code_lines ];

        lines = cleanup(lines);
        writeFile(lines);
    }

    if (iface_kind === 'step' && !has_class_connections) {
        edit_data = await setFileInfo(data);
        let { text_lines: lines, class_def_range } = edit_data;
        const mandatory_step_methods = InterfaceCreator.mandatoryStepMethodsCode(
            code_info,
            data['base-class-name'],
            lang
        );

        const end = class_def_range.end;
        const lines_before = lines.splice(0, end.line);
        const line = lines.splice(0, 1)[0];
        const line_before = line.substr(0, end.character - 1);
        const line_after = line.substr(end.character - 1);
        const lines_after = lines;

        let new_code = line_before + mandatory_step_methods;
        const new_code_lines = new_code.split(/\r?\n/);
        if (new_code_lines[new_code_lines.length - 1] === '') {
            new_code_lines.pop();
        }

        lines = [
            ...lines_before,
            ...new_code_lines,
            line_after,
            ...lines_after
        ];

        writeFile(lines);
    } else {
        let methods_to_add = [];
        (method_names || []).forEach(method_name => {
            if (!trigger_names?.includes(method_name)) {
                methods_to_add.push(method_name);
            }
        });
        if (methods_to_add?.length) {
            edit_data = await setFileInfo(mixed_data);
            lines = addMethods(methods_to_add, edit_data, lang);
            lines = cleanup(lines);
            writeFile(lines);
        }
    }

    if (lang === 'java') {
        lines = fixJavaImports(file, [ ...imports, ...more_imports ]);
        writeFile(lines);
    }

    edit_data = await setFileInfo(data);
    lines = possiblyRemoveFirstEmptyLine(edit_data);
    if (lines) {
        writeFile(lines);
    }
};

const insertMemberInitJava = (class_connections, edit_data, lines, line_shift) => {
    const { constructor_range } = edit_data;

    const member_initialization_code_lines = class_connections.memberInitCodeJava().split(/\r?\n/);
    member_initialization_code_lines.pop();

    const constructor_end_line = constructor_range.end.line;
    const end_line = lines[constructor_end_line];
    // if the closing '}' of the constructor is not on a separate line move it to the next line
    if (!end_line.match(/^\s*\}\s*$/)) {
        const end_character = constructor_range.end.character - 1;
        const end_line_1 = end_line.substr(0, end_character);
        const end_line_2 = ' '.repeat(end_character) + end_line.substr(end_character);
        lines.splice(constructor_end_line, 1, end_line_1, end_line_2);
        line_shift++;
    }

    lines.splice(constructor_end_line + line_shift, 0, ...member_initialization_code_lines);
    line_shift += member_initialization_code_lines.length;

    return { lines, line_shift };
};

const insertMemberDeclAndMaybeInit = (class_connections, edit_data, lang) => {
    const {
        text_lines,
        private_member_block_range,
        last_class_line,
        last_base_class_range,
        constructor_range
    } = edit_data;
    let lines = [ ...text_lines ];
    let line_shift = 0;

    const member_decl_code = lang === 'qore'
        ? class_connections.memberDeclAndInitCodeQore()
        : constructor_range !== undefined
            ? class_connections.memberDeclCodeJava()
            : class_connections.memberDeclAndInitAllCodeJava();

    let member_decl_code_lines = member_decl_code.split(/\r?\n/);
    member_decl_code_lines.pop();

    if (private_member_block_range) {
        const private_member_block_end_line = private_member_block_range.end.line;
        const end_line = lines[private_member_block_end_line];
        // if the closing '}' of the private declaration block is not on a separate line move it to the next line
        if (!end_line.match(/^\s*\}\s*$/)) {
            const end_character = private_member_block_range.end.character - 1;
            const end_line_1 = end_line.substr(0, end_character);
            const end_line_2 = ' '.repeat(end_character) + end_line.substr(end_character);
            lines.splice(private_member_block_end_line, 1, end_line_1, end_line_2);
            line_shift++;
        }

        lines.splice(private_member_block_end_line + line_shift, 0, ...member_decl_code_lines);
        line_shift += member_decl_code_lines.length;
    } else {
        let target_line; // line after which to insert the private member block
        // make sure that there is nothing after the opening '{' of the main class
        const class_decl_line_rest = lines[last_base_class_range.end.line].substr(last_base_class_range.end.character);
        // find the line with the '{'
        if (class_decl_line_rest.match(/^\s*\{\s*$/)) {
            target_line = last_base_class_range.end.line + 1;
        } else {
            for (let i = last_base_class_range.end.line; i < last_class_line; i++) {
                if (lines[i].match(/^\s*\{/)) {
                    if (lines[i].match(/^\s*\{\s*$/)) {
                        target_line = i;
                    } else {
                        const pos = lines[i].indexOf('{');
                        const extra_line = ' '.repeat(pos + 1) + lines[i].substr(pos + 1);
                        lines[i] = lines[i].substr(0, pos + 1);
                        lines.splice(i, 0, extra_line);
                        target_line = i + 1;
                        line_shift++;
                    }
                    break;
                }
            }
        }

        if (lang === 'qore') {
            lines.splice(target_line, 0, `${indent}private {`, `${indent}}` , '');
            line_shift += 3;
        } else {
            target_line--;
        }

        lines.splice(target_line + 1, 0, ...member_decl_code_lines);
        line_shift += member_decl_code_lines.length;
    }

    return { lines, line_shift };
};

const insertTriggerCode = (trigger_code, edit_data, lines, line_shift) => {
    if (!trigger_code) {
        return lines ;
    }

    const { last_class_line } = edit_data;
    const trigger_code_lines = trigger_code.split(/\r?\n/);
    trigger_code_lines.pop();
    lines.splice(last_class_line + line_shift, 0, ...trigger_code_lines);
    line_shift += trigger_code_lines.length;

    return lines;
};

const removeClassConnectionsCode = (edit_data, iface_kind, trigger_names) => {
    const {
        text_lines,
        class_connections_class_range,
        class_connections_member_declaration_range,
        class_connections_member_initialization_range,
        class_connections_trigger_ranges,
        method_decl_ranges = {},
        constructor_range,
        is_constructor_empty,
    } = edit_data;

    let ranges = [
        class_connections_class_range,
        class_connections_member_declaration_range,
        class_connections_member_initialization_range
    ].filter(range => range !== undefined);

    if (is_constructor_empty) {
        ranges.push(constructor_range);
    }

    if (iface_kind === 'step' && trigger_names) {
        Object.keys(method_decl_ranges).forEach(method_name => {
            if (trigger_names.includes(method_name)) {
                ranges.push(method_decl_ranges[method_name]);
            }
        });
    } else {
        ranges = [ ...ranges, ... class_connections_trigger_ranges || [] ];
    }

    return removeRanges([...text_lines], ranges);
};

const removeRanges = (lines, ranges) => {
    const sorted_ranges = sortRanges(ranges).reverse();
    sorted_ranges.forEach(range => {
        lines = removeRange(lines, range);
    });

    return lines;
};

const removeRange = (orig_lines, range) => {
    let lines = [];

    for (let i = 0; i < range.start.line; i++) {
        lines.push(orig_lines[i]);
    }
    if (range.start.line === range.end.line) {
        let line = orig_lines[range.start.line];
        line = line.substr(0, range.start.character) + line.substr(range.end.character + 1);
        if (line.match(/\S/)) {
            lines.push(line);
        }
    } else {
        let line_a = orig_lines[range.start.line];
        let line_b = orig_lines[range.end.line];
        line_a = line_a.substr(0, range.start.character) || '';
        line_b = line_b.substr(range.end.character + 1) || '';
        [line_a, line_b].forEach(line => {
            if (line.match(/\S/)) {
                lines.push(line);
            }
        });
    }
    for (let i = range.end.line + 1; i < orig_lines.length; i++) {
        lines.push(orig_lines[i]);
    }

    return lines;
};

const addMethods = (method_names, edit_data, lang) => {
    const { text_lines, class_def_range } = edit_data;

    const lines = InterfaceCreator.addClassMethods(
        [ ... text_lines ],
        method_names,
        class_def_range,
        simple_method_template[lang],
        lang
    );

    return lines;
};

const removeMethods = (method_names, edit_data) => {
    const { text_lines, method_decl_ranges } = edit_data;

    const lines = InterfaceCreator.removeClassMethods(
        [ ... text_lines ],
        method_names,
        method_decl_ranges
    );

    return lines;
};

const deleteEmptyPrivateMemberBlock = edit_data => {
    const { text_lines, private_member_block_range: block } = edit_data;
    let lines = [];

    for (let i = 0; i < block.start.line; i++) {
        lines.push(text_lines[i]);
    }

    lines.push(text_lines[block.start.line].substr(0, block.start.character));
    lines.push(text_lines[block.end.line].substr(block.end.character));
    if (text_lines[block.end.line + 1].match(/\S/)) {
        lines.push(text_lines[block.end.line + 1]);
    }
    for (let i = block.end.line + 2; i < text_lines.length; i++) {
        lines.push(text_lines[i]);
    }

    return lines;
}

const cleanup = dirty_lines => {
    const isGeneratedBegin = line => line.indexOf(GENERATED_TEXT.begin) > -1;
    const isGeneratedEnd = line => line.indexOf(GENERATED_TEXT.end) > -1;

    // 1. trim ending whitespaces of each line
    // 2. remove sections of generated code (between BEGIN and END) with only empty lines inside
    // 3 .remove GENERATED END lines with no matching GENERATED BEGIN line
    // 4. reduce double empty lines
    // 5. remove empty lines at the end
    let generated_lines = [];
    let is_generated_empty;
    let is_inside_generated = false;
    let is_previous_empty = false;

    let lines = [];
    let line;
    while ((line = dirty_lines.shift()) !== undefined) {
        line = line.trimEnd(); // 1.
        if (isGeneratedBegin(line)) {
            generated_lines.push(line);
            is_generated_empty = true;
            is_inside_generated = true;
        } else if (isGeneratedEnd(line)) {
            if (!is_inside_generated) {
                continue; // 3.
            }
            generated_lines.push(line);
            if (!is_generated_empty) {
                lines = [...lines, ...generated_lines];
            }
            generated_lines = [];
            is_inside_generated = false;
            is_previous_empty = false;
        } else if (is_inside_generated) {
            generated_lines.push(line);
            is_generated_empty = is_generated_empty && line === '';
        } else {
            const is_empty = line === '';
            if (!is_empty || !is_previous_empty) {
                lines.push(line);
            }
            is_previous_empty = is_empty;
        }
    }

    // 5.
    while (lines[lines.length-1] === '') {
        lines.pop();
    }

    return lines;
};

const fixJavaImports = (file, imports) => {
    const doc: QoreTextDocument = qoreTextDocument(file);
    let lines = doc.text.split(/\r?\n/);

    while (lines[lines.length-1] === '') {
        lines.pop();
    }

    let package_line;
    if (lines[0].startsWith('package ')) {
        package_line = lines[0];
        lines.shift();
    }

    while (lines[0] === '' || lines[0].startsWith('import ')) {
        lines.shift();
    }

    lines.unshift('');
    imports.reverse().forEach(imp => {
        lines.unshift(imp);
    });
    if (package_line) {
        lines.unshift('');
        lines.unshift(package_line);
    }

    return lines;
};

const possiblyRemoveFirstEmptyLine = edit_data => {
    const { text_lines: lines, last_class_line, last_base_class_range } = edit_data;

    const class_decl_line_rest = lines[last_base_class_range.end.line].substr(last_base_class_range.end.character);
    let first_line;

    // find the line with the '{'
    if (class_decl_line_rest.match(/^\s*\{\s*$/)) {
        first_line = last_base_class_range.end.line + 1;
    } else {
        for (let i = last_base_class_range.end.line; i < last_class_line; i++) {
            if (lines[i].match(/^\s*\{/)) {
                if (lines[i].match(/^\s*\{\s*$/)) {
                    first_line = i + 1;
                } else {
                    const pos = lines[i].indexOf('{');
                    const extra_line = ' '.repeat(pos + 1) + lines[i].substr(pos + 1);
                    lines[i] = lines[i].substr(0, pos + 1);
                    lines.splice(i, 0, extra_line);
                    first_line = i + 2;
                }
                break;
            }
        }
    }

    if (first_line && lines[first_line] == '') {
        lines.splice(first_line, 1);
        return lines;
    }
    return undefined;
};
