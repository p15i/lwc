// import * as target from '../watcher';
import * as api from "../api";
import { patch } from '../patch';
import { Element } from "../html-element";

describe('vm', () => {
    describe('integration', () => {
        var elm, vnode0;

        beforeEach(function() {
            elm = document.createElement('x-foo');
            vnode0 = elm;
        });

        it('should assign idx=0 (insertion index) during construction', () => {
            let idx;
            class MyComponent1 extends Element {
                constructor() {
                    super();
                    idx = vnode0.vm.idx;
                }
            }
            vnode0 = api.c('x-foo', MyComponent1, {});
            patch(elm, vnode0);
            expect(idx).toBe(0);
        });

        it('should assign idx>0 after insertion', () => {
            class MyComponent2 extends Element {}
            vnode0 = api.c('x-foo', MyComponent2, {});
            patch(elm, vnode0);
            expect(vnode0.vm.idx).toBeGreaterThan(0);
        });

        it('should assign idx=0 after removal', () => {
            document.body.appendChild(elm); // destroy hook is only invoked if the element is trully in the DOM :/
            class MyComponent3 extends Element {}
            vnode0 = api.c('x-foo', MyComponent3, {});
            patch(elm, vnode0);
            const vnode1 = api.h('div', {}, []);
            patch(vnode0, vnode1);
            expect(vnode0.vm.idx).toBe(0);
        });

        it('should assign bigger idx to children', () => {
            class ChildComponent41 extends Element {}
            const vnodeChild = api.c('x-bar', ChildComponent41, {});
            class MyComponent4 extends Element {
                render() {
                    return () => [vnodeChild];
                }
            }
            vnode0 = api.c('x-foo', MyComponent4, {});
            patch(elm, vnode0);
            expect(vnode0.vm.idx).toBeGreaterThan(0);
            expect(vnodeChild.vm.idx).toBeGreaterThan(vnode0.vm.idx);
        });

        it('should assign bigger idx on reinsertion, including children idx', () => {
            document.body.appendChild(elm); // destroy hook is only invoked if the element is trully in the DOM :/
            let counter = 0;
            class ChildComponent51 extends Element {
                render() {
                    counter++;
                }
            }
            let vnodeChild;
            class MyComponent5 extends Element {
                render() {
                    vnodeChild = api.c('x-bar', ChildComponent51, {});
                    return () => [vnodeChild];
                }
            }
            vnode0 = api.c('x-foo', MyComponent5, {});
            patch(elm, vnode0); // insertion
            const firstIdx = vnode0.vm.idx;
            const vnode1 = api.h('div', {}, []);
            patch(vnode0, vnode1); // removal
            expect(vnode0.vm.idx).toBe(0);
            expect(vnodeChild.vm.idx).toBe(0);
            patch(vnode1, vnode0); // re-insertion
            expect(vnode0.vm.idx).toBeGreaterThan(firstIdx);
            expect(vnodeChild.vm.idx).toBeGreaterThan(vnode0.vm.idx);
            expect(counter).toBe(2);
        });

    });

});
