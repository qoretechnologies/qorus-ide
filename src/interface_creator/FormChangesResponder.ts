import { qorus_webview } from '../QorusWebview';
import { default_lang } from '../qorus_constants';
import { t } from 'ttag';


export class FormChangesResponder {
    static configItemTypeChanged({type, iface_id, iface_kind}) {
        const postMessage = (action, fields) => fields.forEach(field =>
            qorus_webview.postMessage({
                action: `creator-${action}-field`,
                field,
                iface_id,
                iface_kind
            })
        );

        if (type === 'any') {
            postMessage('remove', ['can_be_undefined', 'allowed_values']);
            postMessage('disable', ['can_be_undefined', 'allowed_values']);
        } else {
            postMessage('enable', ['can_be_undefined', 'allowed_values']);
            postMessage('add', ['can_be_undefined']);
        }
    }

    static langChanged({ lang, iface_id, iface_kind }, interface_info) {
        if (lang === 'java') {
            qorus_webview.postMessage({
                action: 'creator-remove-field',
                field: 'target_file',
                iface_id,
                iface_kind
            });
            qorus_webview.postMessage({
                action: 'creator-disable-field',
                field: 'target_file',
                iface_id,
                iface_kind
            });
        }

        const orig_lang = interface_info.getData(iface_id)?.lang || default_lang;
        if (orig_lang !== lang) {
            qorus_webview.postMessage({
                action: 'maybe-recreate-interface',
                message: t`LangChangeRecreateQuestion`
            });
        }
    }

    static fieldAdded({field, iface_id, iface_kind}) {
        const addField = field =>
            qorus_webview.postMessage({ action: 'creator-add-field', field, iface_id, iface_kind });

        switch(field) {
            case 'class-name':
                if (iface_kind === 'workflow') {
                    addField('base-class-name');
                    addField('lang');
                }
                break;
            case 'base-class-name':
                if (iface_kind === 'workflow') {
                    addField('class-name');
                    addField('lang');
                }
                break;
            case 'lang':
                if (iface_kind === 'workflow') {
                    addField('class-name');
                    addField('base-class-name');
                }
                break;
            case 'processor':
                if (iface_kind === 'class') {
                    addField('base-class-name');
                }
                break;
        }
    }

    static fieldRemoved({field, interface_info, ...other_params}) {
        const {iface_id, iface_kind} = other_params;

        const removeField = field =>
            qorus_webview.postMessage({ action: 'creator-remove-field', field, iface_id, iface_kind });

        switch(field) {
            case 'base-class-name':
                if (iface_kind === 'workflow') {
                    removeField('class-name');
                    removeField('lang');
                }
                if (iface_kind === 'class') {
                    removeField('processor');
                }
                interface_info.removeBaseClass(other_params);
                interface_info.getConfigItems(other_params);
                break;
            case 'class-name':
                if (iface_kind === 'workflow') {
                    removeField('base-class-name');
                    removeField('lang');
                }
                break;
            case 'lang':
                if (iface_kind === 'workflow') {
                    removeField('base-class-name');
                    removeField('class-name');
                }
                break;
            case 'classes':
            case 'requires':
                interface_info.removeAllClasses(other_params);
                break;
        }
    }
}
