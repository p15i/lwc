// import * as target from '../watcher';
import * as api from "../api";
import { patch } from '../patch';
import { Element } from "../html-element";

describe('watcher', () => {

    describe('integration', () => {

        it('should not rerender the component if nothing changes', () => {
            let counter = 0;
            const def = class MyComponent1 extends Element {
                render() {
                    counter++;
                }
            }
            const elm = document.createElement('x-foo');
            const vnode1 = api.c('x-foo', def, {});
            const vnode2 = api.c('x-foo', def, {});
            patch(elm, vnode1);
            patch(vnode1, vnode2);
            expect(counter).toBe(1);
        });

        it('should rerender the component if any reactive prop changes', () => {
            let counter = 0;
            const def = class MyComponent2 extends Element {
                render() {
                    counter++;
                    // TODO: if x is used in render (outside of html), and it is not used inside the compiled template
                    // should it still be reactive. We don't know if this must be the case, so
                    // we are deferring this decision from now.
                    // In the case of the slots, since they are only accessible from within the template,
                    // the same rule applies, but without an observable difference.
                    return function html($api, $cmp) {
                        $cmp.x;
                        return [];
                    };
                }
            }
            def.publicProps = { x: 1 };
            const elm = document.createElement('x-foo');
            const vnode1 = api.c('x-foo', def, { props: { x: 2 } });
            const vnode2 = api.c('x-foo', def, { props: { x: 3 } });
            patch(elm, vnode1);
            patch(vnode1, vnode2);
            expect(counter).toBe(2);
        });

        it('should not rerender the component if a non-reactive prop changes', () => {
            let counter = 0;
            const def = class MyComponent3 extends Element {
                render() {
                    counter++;
                }
            }
            def.publicProps = { x: 1 };
            const elm = document.createElement('x-foo');
            const vnode1 = api.c('x-foo', def, { props: { x: 2 } });
            const vnode2 = api.c('x-foo', def, { props: { x: 3 } });
            patch(elm, vnode1);
            patch(vnode1, vnode2);
            expect(counter).toBe(1);
        });

        it('should rerender the component if any reactive slot changes', () => {
            let counter = 0;
            const def = class MyComponent4 extends Element {
                render() {
                    counter++;
                    return function html($api, $cmp, $slotset) {
                        $slotset.x;
                        return [];
                    };
                }
            }
            const elm = document.createElement('x-foo');
            const vnode1 = api.c('x-foo', def, {});
            const vnode2 = api.c('x-foo', def, { slotset: { x: [api.h('p', {}, [])] } });
            patch(elm, vnode1);
            patch(vnode1, vnode2);
            expect(counter).toBe(2);
        });

        it('should not rerender the component if a non-reactive slot changes', () => {
            let counter = 0;
            const def = class MyComponent5 extends Element {
                render() {
                    counter++;
                }
            }
            def.publicProps = { x: 1 };
            const elm = document.createElement('x-foo');
            const vnode1 = api.c('x-foo', def, { slotset: { x: [] } });
            const vnode2 = api.c('x-foo', def, { slotset: { x: [/* new array */] } });
            patch(elm, vnode1);
            patch(vnode1, vnode2);
            expect(counter).toBe(1);
        });

        it('should rerender the component if reactive state changes', () => {
            let counter = 0;
            let state;
            const def = class MyComponent6 extends Element {
                state = { x: 0 };
                constructor() {
                    super();
                    state = this.state;
                }
                render() {
                    counter++;
                    return function html($api, $cmp) {
                        $cmp.state.x;
                        return [];
                    };
                }
            }
            const elm = document.createElement('x-foo');
            const vnode = api.c('x-foo', def, {});
            patch(elm, vnode);
            expect(counter).toBe(1);
            state.x = 1;
            return Promise.resolve().then(() => {
                expect(counter).toBe(2);
            });
        });

        it('should not rerender the component if a non-reactive state changes', () => {
            let counter = 0;
            let state;
            const def = class MyComponent7 extends Element {
                state = { x: 0 };
                constructor() {
                    super();
                    state = this.state;
                }
                render() {
                    counter++;
                }
            }
            const elm = document.createElement('x-foo');
            const vnode = api.c('x-foo', def, {});
            patch(elm, vnode);
            expect(counter).toBe(1);
            state.x = 1; // this is not used in the rendering phase
            return Promise.resolve().then(() => {
                expect(counter).toBe(1);
            });
        });

        it('should prevent any mutation during the rendering phase', () => {
            const def = class MyComponent8 extends Element {
                state = { x: 0 };
                render() {
                    return function html($api, $cmp) {
                        $cmp.state.x = 1;
                    };
                }
            }
            const elm = document.createElement('x-foo');
            const vnode = api.c('x-foo', def, {});
            expect(() => patch(elm, vnode)).toThrow();
        });

        it('should compute reactive state per rendering', () => {
            let counter = 0;
            let state;
            const def = class MyComponent9 extends Element {
                state = { x: 0 };
                constructor() {
                    super();
                    state = this.state;
                }
                render() {
                    counter++;
                    return function html($api, $cmp) {
                        if (counter === 1) {
                            $cmp.state.x;
                        }
                        return [];
                    };
                }
            }
            const elm = document.createElement('x-foo');
            const vnode = api.c('x-foo', def, {});
            patch(elm, vnode);
            expect(counter).toBe(1);
            state.x = 1; // this is marked as reactive
            return Promise.resolve().then(() => {
                expect(counter).toBe(2);
                state.x = 2; // this is not longer reactive and should not trigger the rerendering anymore
                return Promise.resolve().then(() => {
                    expect(counter).toBe(2);
                });
            });
        });

        it('should mark public prop as reactive even if it is used via a getter', () => {
            let counter = 0;
            const def = class MyComponent2 extends Element {
                get foo() {
                    return this.x;
                }
                render() {
                    counter++;
                    // TODO: if x is used in render (outside of html), and it is not used inside the compiled template
                    // should it still be reactive. We don't know if this must be the case, so
                    // we are deferring this decision from now.
                    // In the case of the slots, since they are only accessible from within the template,
                    // the same rule applies, but without an observable difference.
                    return function html($api, $cmp) {
                        $cmp.foo;
                        return [];
                    };
                }
            }
            def.publicProps = { x: 1 };
            const elm = document.createElement('x-foo');
            const vnode1 = api.c('x-foo', def, { props: { x: 2 } });
            const vnode2 = api.c('x-foo', def, { props: { x: 3 } });
            patch(elm, vnode1);
            patch(vnode1, vnode2);
            expect(counter).toBe(2);
        });

        it('should allow observing public prop via setter', () => {
            let counter = 0;
            let newValue, oldValue;
            class MyComponent2 extends Element {
                set x(value) {
                    counter++;
                    oldValue = newValue;
                    newValue = value;
                }
                get x() {
                    return newValue;
                }
            }
            MyComponent2.publicProps = { x: { config: 3 } };
            const elm = document.createElement('x-foo');
            const vnode1 = api.c('x-foo', MyComponent2, { props: { x: 2 } });
            patch(elm, vnode1);
            expect(counter).toBe(1);
            expect(newValue).toBe(2);
            expect(oldValue).toBeUndefined();
        });

    });

    describe('#reactivity()', () => {
        it('should react when a reactive array invokes Array.prototype.push()', () => {
            let counter = 0;
            class MyComponent1 extends Element {
                state = { list: [1, 2] };
                render() {
                    counter++;
                    this.state.list.map((v) => v + 1);
                }
            }
            const elm = document.createElement('x-foo');
            const vnode1 = api.c('x-foo', MyComponent1, {});
            patch(elm, vnode1);
            expect(counter).toBe(1);
            vnode1.vm.component.state.list.push(3);
            return Promise.resolve().then(() => {
                expect(counter).toBe(2);
            });
        });
        it('should react when a reactive array invokes Array.prototype.pop()', () => {
            let counter = 0;
            class MyComponent1 extends Element {
                state = { list: [1, 2] };
                render() {
                    counter++;
                    this.state.list.map((v) => v + 1);
                }
            }
            const elm = document.createElement('x-foo');
            const vnode1 = api.c('x-foo', MyComponent1, {});
            patch(elm, vnode1);
            expect(counter).toBe(1);
            vnode1.vm.component.state.list.pop();
            return Promise.resolve().then(() => {
                expect(counter).toBe(2);
            });
        });
        it('should react when a reactive array invokes Array.prototype.unshift()', () => {
            let counter = 0;
            class MyComponent1 extends Element {
                state = { list: [1, 2] };
                render() {
                    counter++;
                    this.state.list.map((v) => v + 1);
                }
            }
            const elm = document.createElement('x-foo');
            const vnode1 = api.c('x-foo', MyComponent1, {});
            patch(elm, vnode1);
            expect(counter).toBe(1);
            vnode1.vm.component.state.list.unshift(3);
            return Promise.resolve().then(() => {
                expect(counter).toBe(2);
            });
        });
    });

    describe('#subscribeToSetHook()', () => {
        // TBD
    });

    describe('#notifyListeners()', () => {
        // TBD
    });

});
