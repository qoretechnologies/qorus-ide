import { combineReducers } from 'redux';

function simpleReducer(state, action, type) {
  return action.type == type ? action[type] : state;
}

function currentProjectFolder(state = '', action) {
  return simpleReducer(state, action, 'current_project_folder');
}

function currentQorusInstance(state = null, action) {
  return simpleReducer(state, action, 'current_qorus_instance');
}

function loginVisible(state = false, action) {
  return simpleReducer(state, action, 'login_visible');
}

function loginQorus(state = null, action) {
  return simpleReducer(state, action, 'login_qorus');
}

function loginError(state = null, action) {
  return simpleReducer(state, action, 'login_error');
}

function deleteIfacesKind(state = 'workflows', action) {
  return simpleReducer(state, action, 'delete_ifaces_kind');
}

function deleteIfacesAll(state = {}, action) {
  return simpleReducer(state, action, 'delete_ifaces_all');
}

function deleteIfacesChecked(state = {}, action) {
  return simpleReducer(state, action, 'delete_ifaces_checked');
}

function configSelectedEnv(state = null, action) {
  return simpleReducer(state, action, 'config_selected_env');
}

function configSelectedQorus(state = null, action) {
  return simpleReducer(state, action, 'config_selected_qorus');
}

function configType(state = 'qoruses', action) {
  return simpleReducer(state, action, 'config_type');
}

function configData(state = null, action) {
  return simpleReducer(state, action, 'config_data');
}

function configEditPopoverOpen(state = {}, action) {
  if (action.type == 'config_edit_popover_open') {
    return Object.assign({}, state, { [action.id]: action.open });
  }
  return state;
}

function releaseStep(state = 0, action) {
  return simpleReducer(state, action, 'release_step');
}

function releaseBranch(state = null, action) {
  return simpleReducer(state, action, 'release_branch');
}

function releaseCommitHash(state = null, action) {
  return simpleReducer(state, action, 'release_commit_hash');
}

function releaseCommit(state = null, action) {
  return simpleReducer(state, action, 'release_commit');
}

function releaseCommits(state = null, action) {
  return simpleReducer(state, action, 'release_commits');
}

function releaseFiles(state = [], action) {
  return simpleReducer(state, action, 'release_files');
}

function releasePending(state = false, action) {
  return simpleReducer(state, action, 'release_pending');
}

function releasePackagePath(state = null, action) {
  return simpleReducer(state, action, 'release_package_path');
}

function releaseSavedPath(state = null, action) {
  return simpleReducer(state, action, 'release_saved_path');
}

function releaseResult(state = null, action) {
  return simpleReducer(state, action, 'release_result');
}

function releaseType(state = 'custom', action) {
  return simpleReducer(state, action, 'release_type');
}

function releaseFilter(state = { hash: '', branch: '', tag: '' }, action) {
  if (action.type === 'release_filter') {
    return Object.assign({}, state, { [action.filter]: action.value });
  }
  return state;
}

function createIfaceTargetDir(state = null, action) {
  return simpleReducer(state, action, 'create_iface_target_dir');
}

function msgOpen(state = { config_changed: false, release_not_up_to_date: false }, action) {
  switch (action.type) {
    case 'config_changed_msg_open':
      return Object.assign({}, state, { config_changed: action.open });
    case 'release_not_up_to_date_msg_open':
      return Object.assign({}, state, { release_not_up_to_date: action.open });
    default:
      return state;
  }
}

function activeTabQueue(state = ['ProjectConfig'], action) {
  let index;
  let new_state = [...state];
  switch (action.type) {
    case 'active_tab':
      index = new_state.indexOf(action.active_tab);
      if (index > -1) {
        new_state.splice(index, 1);
      }
      new_state.unshift(action.active_tab);
      return new_state;
    case 'close_tab':
      index = new_state.indexOf(action.tab);
      if (index > -1) {
        new_state.splice(index, 1);
      }
      return new_state;
    default:
      return state;
  }
}

function loginData(state = { username: '', password: '' }, action) {
  switch (action.type) {
    case 'login_username':
      return Object.assign({}, state, { username: action.username });
    case 'login_password':
      return Object.assign({}, state, { password: action.password });
    case 'login_clear':
      return { username: '', password: '' };
    default:
      return state;
  }
}

export default function reducer(state = {}, action) {
  return combineReducers({
    active_tab_queue: activeTabQueue,
    current_project_folder: currentProjectFolder,
    current_qorus_instance: currentQorusInstance,
    login_visible: loginVisible,
    login_qorus: loginQorus,
    login_error: loginError,
    login_data: loginData,
    delete_ifaces_kind: deleteIfacesKind,
    delete_ifaces_all: deleteIfacesAll,
    delete_ifaces_checked: deleteIfacesChecked,
    msg_open: msgOpen,
    config_type: configType,
    config_data: configData,
    config_selected_env: configSelectedEnv,
    config_selected_qorus: configSelectedQorus,
    config_edit_popover_open: configEditPopoverOpen,
    release_step: releaseStep,
    release_branch: releaseBranch,
    release_commit: releaseCommit,
    release_commits: releaseCommits,
    release_commit_hash: releaseCommitHash,
    release_files: releaseFiles,
    release_pending: releasePending,
    release_package_path: releasePackagePath,
    release_saved_path: releaseSavedPath,
    release_result: releaseResult,
    release_type: releaseType,
    release_filter: releaseFilter,
    create_iface_target_dir: createIfaceTargetDir,
  })(state, action);
}
