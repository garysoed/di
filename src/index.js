import Scope from './scope';

((window) => {
  window['DIJS'] = new Scope('(root)', null /* provider */, new Map());
  window['DIJS']['Scope'] = Scope;
})(window);
