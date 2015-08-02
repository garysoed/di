import Binding from './binding';
import RunContext from './runcontext';
import Scope from './scope';

((window) => {
  window['DIJS'] = new Scope();
  window['DIJS']['Scope'] = Scope;
  window['DIJS']['Binding'] = Binding;
  window['DIJS']['RunContext'] = RunContext;
})(window);
