import Scope from './scope';
import Binding from './binding';

((window) => {
  window['DIJS'] = new Scope();
  window['DIJS']['Scope'] = Scope;
  window['DIJS']['Scope']['Binding'] = Binding;
})(window);
