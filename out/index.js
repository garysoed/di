<html><head></head><body>import Scope from './scope';

((window) =&gt; {
  window['DIJS'] = new Scope('(root)', null /* provider */, new Map());
  window['DIJS']['Scope'] = Scope;
})(window);
</body></html>