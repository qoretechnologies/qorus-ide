import * as fs from 'fs';
import * as jsyaml from 'js-yaml';
import * as path from 'path';
import { t } from 'ttag';

import * as msg from './qorus_message';
import { root_steps, root_job, root_service, root_workflow,
         types, types_with_version, default_version, root_processor } from './qorus_constants';


export class QorusProjectYamlInfo {

    private yaml_data: any = {};

    private src_2_yaml: any = {};
    yamlDataBySrcFile = file => this.yaml_data[this.src_2_yaml[file]];
    yamlDataByYamlFile = file => this.yaml_data[file];
    yamlDataByFile = file => path.extname(file) === '.yaml'
        ? this.yaml_data[file]
        : this.yaml_data[this.src_2_yaml[file]]

    private name_2_yaml: any = {};
    private class_2_yaml: any = {};
    yamlDataByName = (type, name) => this.yaml_data[this.name_2_yaml[type][name]];
    yamlDataByClass = (type, class_name) => this.yaml_data[this.class_2_yaml[type][class_name]];
    yamlDataByType = type => {
        let ret_val = {};
        for (const name in this.name_2_yaml[type] || {}) {
            ret_val[name] = this.yamlDataByName(type, name);
        }
        return ret_val;
    }

    private yaml_2_src: any = {};

    private authors: any = {};
    getAuthors = () => Object.keys(this.authors).map(name => ({name}));

    private inheritance_pairs: any = {};
    private java_inheritance_pairs: any = {};
    private python_inheritance_pairs: any = {};

    private service_classes = {};
    private job_classes = {};
    private workflow_classes = {};
    private step_classes = {};
    private processor_classes = {};

    private java_job_classes = {};
    private java_service_classes = {};
    private java_step_classes = {};
    private java_workflow_classes = {};
    private java_processor_classes = {};

    private python_job_classes = {};
    private python_service_classes = {};
    private python_step_classes = {};
    private python_workflow_classes = {};
    private python_processor_classes = {};

    serviceClasses = lang => {
        switch (lang) {
            case 'python': return { ...this.python_service_classes };
            case 'java': return { ...this.java_service_classes };
            default: return { ...this.service_classes };
        }
    }

    jobClasses = lang => {
        switch (lang) {
            case 'python': return { ...this.python_job_classes };
            case 'java': return { ...this.java_job_classes };
            default: return { ...this.job_classes };
        }
    }

    workflowClasses = lang => {
        switch (lang) {
            case 'python': return { ...this.python_workflow_classes };
            case 'java': return { ...this.java_workflow_classes };
            default: return { ...this.workflow_classes };
        }
    }

    processorClasses = lang => {
        switch (lang) {
            case 'python': return { ...this.python_processor_classes };
            case 'java': return { ...this.java_processor_classes };
            default: return { ...this.processor_classes };
        }
    }

    stepClasses = (step_type, lang = 'qore') => {
        switch (lang) {
            case 'python': return { ...this.python_step_classes[step_type] };
            case 'java': return { ...this.java_step_classes[step_type] };
            default: return { ...this.step_classes[step_type] };
        }
    }

    allStepClasses = lang => {
        let ret_val = {};
        for (const step_type of root_steps) {
            switch (lang) {
                case 'python':
                    Object.assign(ret_val, this.python_step_classes[step_type]);
                    break;
                case 'java':
                    Object.assign(ret_val, this.java_step_classes[step_type]);
                    break;
                default:
                    Object.assign(ret_val, this.step_classes[step_type]);
                    break;
            }
        }
        return ret_val;
    }

    getValue = (file, key) => this.yaml_data[file]?.[key];
    getSrcFile = yaml_file => this.yaml_2_src[yaml_file];

    initData = () => {
        this.yaml_data = {};

        this.yaml_2_src = {};
        this.src_2_yaml = {};
        this.authors = {};

        types.forEach(type => {
            this.name_2_yaml[type] = {};
            this.class_2_yaml[type] = {};
        });

        this.inheritance_pairs = {};
        this.java_inheritance_pairs = {};
        this.python_inheritance_pairs = {};

        this.job_classes = { [root_job]: true };
        this.service_classes = { [root_service]: true };
        this.workflow_classes = { [root_workflow]: true };
        this.processor_classes = { [root_processor]: true };

        this.java_job_classes = { [root_job]: true };
        this.java_service_classes = { [root_service]: true };
        this.java_workflow_classes = { [root_workflow]: true };
        this.java_processor_classes = { [root_processor]: true };

        this.python_job_classes = { [root_job]: true };
        this.python_service_classes = { [root_service]: true };
        this.python_workflow_classes = { [root_workflow]: true };
        this.python_processor_classes = { [root_processor]: true };

        for (const step_type of root_steps) {
            this.step_classes[step_type] = { [step_type]: true };
            this.java_step_classes[step_type] = { [step_type]: true };
            this.python_step_classes[step_type] = { [step_type]: true };
        }
    }

    addSingleYamlInfo(file: string) {
        let data: any;
        let file_contents;
        try {
            file_contents = fs.readFileSync(file);
            data = jsyaml.safeLoad(file_contents);
        } catch (error) {
            msg.debug({ file, error });
            return;
        }

        if (!data?.type) {
            return;
        }

        // possibly fix old classes with both name and class-name
        if (['class', 'mapper-code'].includes(data.type) && data['class-name'] && data.name !== data['class-name']) {
            data.name = data['class-name'];
            delete data['class-name'];

            const lines = file_contents.toString().split(/\r?\n/);
            let fixed_lines = [];
            lines.forEach(line => {
                if (line.substr(0, 5) === 'name:') {
                    return;
                }
                if (line.substr(0, 11) === 'class-name:') {
                    fixed_lines.push(line.substr(6));
                } else {
                    fixed_lines.push(line);
                }
            });

            while (/^\s*$/.test(fixed_lines.slice(-1)[0])) {
                fixed_lines.pop();
            }

            fs.writeFile(file, fixed_lines.join('\n') + '\n', err => {
                if (err) {
                    msg.error(t`WriteFileError ${file} ${err.toString()}`);
                }
            });

            this.addSingleYamlInfo(file);
            return;
        }

        let yaml_data = {
            ...data,
            yaml_file: file,
            target_dir: path.dirname(file),
        };
        yaml_data.target_file = yaml_data.code;

        this.yaml_data[file] = yaml_data;

        if (yaml_data.code) {
            const src = path.join(path.dirname(file), yaml_data.code);
            this.src_2_yaml[src] = file;
            this.yaml_2_src[file] = src;
        }

        (yaml_data.author || []).forEach(name => {
            this.authors[name] = true;
        });

        const name = types_with_version.includes(yaml_data.type)
            ? `${yaml_data.name}:${yaml_data.version || default_version}`
            : yaml_data.type === 'type'
                ? yaml_data.path
                : yaml_data.name;

        if (!name) {
            return;
        }

        this.name_2_yaml[yaml_data.type][name] = file;

        const class_name = ['class', 'mapper-code'].includes(yaml_data.type) ? yaml_data.name : yaml_data['class-name'];

        if (class_name) {
            this.class_2_yaml[yaml_data.type][class_name] = file;
        }

        const base_class_name = yaml_data['base-class-name'];

        if (class_name && base_class_name && ['class', 'step'].includes(yaml_data.type)) {
            this.inheritance_pairs[class_name] = [base_class_name];
            if (yaml_data.lang === 'java') {
                this.java_inheritance_pairs[class_name] = [base_class_name];
            }
            if (yaml_data.lang === 'python') {
                this.python_inheritance_pairs[class_name] = [base_class_name];
            }
        }
    }

    private baseClasses = (base_classes: any, inheritance_pairs: any): any => {
        let any_new = true;
        while (any_new) {
            any_new = false;
            for (let name in inheritance_pairs) {
                if (inheritance_pairs[name].some(base_class_name => base_classes[base_class_name])) {
                    base_classes[name] = true;
                    delete inheritance_pairs[name];
                    any_new = true;
                    break;
                }

            }
        }
        return base_classes;
    }

    isDescendantOrSelf = (class_name: string, possible_descendant_class_name: string): boolean => {
        let descendants_and_self = { [class_name]: true };
        this.baseClasses(descendants_and_self, { ...this.inheritance_pairs });
        return Object.keys(descendants_and_self).includes(possible_descendant_class_name);
    }

    baseClassesFromInheritancePairs() {
        this.baseClasses(this.service_classes, { ...this.inheritance_pairs });
        this.baseClasses(this.job_classes, { ...this.inheritance_pairs });
        this.baseClasses(this.workflow_classes, { ...this.inheritance_pairs });
        this.baseClasses(this.processor_classes, { ...this.inheritance_pairs });

        this.baseClasses(this.java_service_classes, { ...this.java_inheritance_pairs });
        this.baseClasses(this.java_job_classes, { ...this.java_inheritance_pairs });
        this.baseClasses(this.java_workflow_classes, { ...this.java_inheritance_pairs });
        this.baseClasses(this.java_processor_classes, { ...this.java_inheritance_pairs });

        this.baseClasses(this.python_service_classes, { ...this.python_inheritance_pairs });
        this.baseClasses(this.python_job_classes, { ...this.python_inheritance_pairs });
        this.baseClasses(this.python_workflow_classes, { ...this.python_inheritance_pairs });
        this.baseClasses(this.python_processor_classes, { ...this.python_inheritance_pairs });

        for (const step_type of root_steps) {
            this.step_classes[step_type] =
                this.baseClasses(this.step_classes[step_type], { ...this.inheritance_pairs });
            this.java_step_classes[step_type] =
                this.baseClasses(this.java_step_classes[step_type], { ...this.java_inheritance_pairs });
            this.python_step_classes[step_type] =
                this.baseClasses(this.python_step_classes[step_type], { ...this.python_inheritance_pairs });
        }
    }
}
