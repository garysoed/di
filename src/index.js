import Scope from './scope';

((window) => {
  window['DIJS'] = new Scope();
  window['DIJS']['Scope'] = Scope;
})(window);
