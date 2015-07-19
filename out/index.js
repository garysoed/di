<html><head></head><body>import BindingTree from './bindingtree';
import Globals from './globals';
import Provider from './provider';
import Scope from './scope';
import OldScope from './oldscope';

((window) =&gt; {
  window['DIJS'] = new Scope();
  window['DIJS']['Scope'] = Scope;

  window['DI'] = new OldScope();
  window['DI']['OldScope'] = OldScope;

  window['DI']['BindingTree'] = BindingTree;
  window['DI']['Provider'] = Provider;
  window['DI']['bindings'] = Globals.bindings;
})(window);
</body></html>