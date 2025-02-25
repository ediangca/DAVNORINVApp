import { AsyncSubject } from "rxjs";
import { AS_COMPLETE, WASM_READY } from "./ngx-scanner-qrcode.helper";
import { WASMPROJECT, WASMREMOTE, WASMREMOTELATEST } from "./ngx-scanner-qrcode.default";
/**
 * LOAD_WASM
 * @param as
 * @param renderer
 * @returns
 */
export const LOAD_WASM = (as = new AsyncSubject(), renderer) => {
    let retry = 0;
    const LOAD_WASM_RETRY = (isLoadWasmRemote = false) => {
        const DONE = () => {
            let timeoutId;
            try {
                const L = () => {
                    clearTimeout(timeoutId);
                    WASM_READY() ? setTimeout(() => AS_COMPLETE(as, true)) : timeoutId = setTimeout(() => L());
                };
                setTimeout(() => L());
                setTimeout(() => clearTimeout(timeoutId), 3000);
            }
            catch (error) {
                clearTimeout(timeoutId);
            }
        };
        const scriptRemote = document.querySelectorAll(`script[src="${WASMREMOTE}"]`);
        const scriptRemoteLatest = document.querySelectorAll(`script[src="${WASMREMOTELATEST}"]`);
        if (scriptRemote.length || scriptRemoteLatest.length) {
            DONE();
        }
        else {
            const scriptProject = document.querySelectorAll(`script[src="${WASMPROJECT}"]`);
            if (scriptProject.length === 1) {
                DONE();
            }
            else {
                scriptProject.forEach(f => f.remove());
                if (renderer) {
                    const script = renderer.createElement("script");
                    renderer.setAttribute(script, "src", isLoadWasmRemote ? WASMREMOTE : WASMPROJECT);
                    renderer.setAttribute(script, "type", "text/javascript");
                    renderer.setAttribute(script, "async", "");
                    renderer.appendChild(document.head, script);
                    script.onload = () => DONE();
                    script.onerror = () => {
                        if (retry < 2) {
                            document.head.removeChild(script);
                            LOAD_WASM_RETRY(true);
                        }
                        else {
                            AS_COMPLETE(as, false, 'Could not load script ' + isLoadWasmRemote ? WASMREMOTE : WASMPROJECT);
                        }
                    };
                    retry += 1;
                }
                else {
                    const mod = document.createElement('script');
                    mod.setAttribute("src", isLoadWasmRemote ? WASMREMOTE : WASMPROJECT);
                    mod.setAttribute("type", "text/javascript");
                    mod.setAttribute("async", "");
                    document.head.appendChild(mod);
                    mod.onload = () => DONE();
                    mod.onerror = () => {
                        if (retry < 2) {
                            document.head.removeChild(mod);
                            LOAD_WASM_RETRY(true);
                        }
                        else {
                            AS_COMPLETE(as, false, 'Could not load script ' + isLoadWasmRemote ? WASMREMOTE : WASMPROJECT);
                        }
                    };
                    retry += 1;
                }
            }
        }
    };
    LOAD_WASM_RETRY();
    return as;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd4LXNjYW5uZXItcXJjb2RlLmxvYWRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL25neC1zY2FubmVyLXFyY29kZS9zcmMvbGliL25neC1zY2FubmVyLXFyY29kZS5sb2FkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLE1BQU0sQ0FBQztBQUNwQyxPQUFPLEVBQUUsV0FBVyxFQUFFLFVBQVUsRUFBRSxNQUFNLDZCQUE2QixDQUFDO0FBRXRFLE9BQU8sRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLGdCQUFnQixFQUFFLE1BQU0sOEJBQThCLENBQUM7QUFFekY7Ozs7O0dBS0c7QUFDSCxNQUFNLENBQUMsTUFBTSxTQUFTLEdBQUcsQ0FBQyxLQUFrQyxJQUFJLFlBQVksRUFBRSxFQUFFLFFBQW9CLEVBQStCLEVBQUU7SUFDakksSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDO0lBQ2QsTUFBTSxlQUFlLEdBQUcsQ0FBQyxnQkFBZ0IsR0FBRyxLQUFLLEVBQUUsRUFBRTtRQUNqRCxNQUFNLElBQUksR0FBRyxHQUFHLEVBQUU7WUFDZCxJQUFJLFNBQWMsQ0FBQztZQUNuQixJQUFJO2dCQUNBLE1BQU0sQ0FBQyxHQUFHLEdBQUcsRUFBRTtvQkFDWCxZQUFZLENBQUMsU0FBUyxDQUFDLENBQUM7b0JBQ3hCLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsV0FBVyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLEdBQUcsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQy9GLENBQUMsQ0FBQTtnQkFDRCxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDdEIsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFD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Q0FBQzs0QkFDL0IsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO3lCQUN6Qjs2QkFBTTs0QkFDSCxXQUFXLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSx3QkFBd0IsR0FBRyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQzt5QkFDbEc7b0JBQ0wsQ0FBQyxDQUFBO29CQUNELEtBQUssSUFBSSxDQUFDLENBQUM7aUJBQ2Q7YUFDSjtTQUNKO0lBQ0wsQ0FBQyxDQUFBO0lBQ0QsZUFBZSxFQUFFLENBQUM7SUFDbEIsT0FBTyxFQUFFLENBQUM7QUFDZCxDQUFDLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBc3luY1N1YmplY3QgfSBmcm9tIFwicnhqc1wiO1xyXG5pbXBvcnQgeyBBU19DT01QTEVURSwgV0FTTV9SRUFEWSB9IGZyb20gXCIuL25neC1zY2FubmVyLXFyY29kZS5oZWxwZXJcIjtcclxuaW1wb3J0IHsgUmVuZGVyZXIyIH0gZnJvbSBcIkBhbmd1bGFyL2NvcmVcIjtcclxuaW1wb3J0IHsgV0FTTVBST0pFQ1QsIFdBU01SRU1PVEUsIFdBU01SRU1PVEVMQVRFU1QgfSBmcm9tIFwiLi9uZ3gtc2Nhbm5lci1xcmNvZGUuZGVmYXVsdFwiO1xyXG5cclxuLyoqXHJcbiAqIExPQURfV0FTTVxyXG4gKiBAcGFyYW0gYXMgXHJcbiAqIEBwYXJhbSByZW5kZXJlciBcclxuICogQHJldHVybnMgXHJcbiAqL1xyXG5leHBvcnQgY29uc3QgTE9BRF9XQVNNID0gKGFzOiBBc3luY1N1YmplY3Q8Ym9vbGVhbiB8IGFueT4gPSBuZXcgQXN5bmNTdWJqZWN0KCksIHJlbmRlcmVyPzogUmVuZGVyZXIyKTogQXN5bmNTdWJqZWN0PGJvb2xlYW4gfCBhbnk+ID0+IHtcclxuICAgIGxldCByZXRyeSA9IDA7XHJcbiAgICBjb25zdCBMT0FEX1dBU01fUkVUUlkgPSAoaXNMb2FkV2FzbVJlbW90ZSA9IGZhbHNlKSA9PiB7XHJcbiAgICAgICAgY29uc3QgRE9ORSA9ICgpID0+IHtcclxuICAgICAgICAgICAgbGV0IHRpbWVvdXRJZDogYW55O1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgTCA9ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTtcclxuICAgICAgICAgICAgICAgICAgICBXQVNNX1JFQURZKCkgPyBzZXRUaW1lb3V0KCgpID0+IEFTX0NPTVBMRVRFKGFzLCB0cnVlKSkgOiB0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KCgpID0+IEwoKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IEwoKSk7XHJcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IGNsZWFyVGltZW91dCh0aW1lb3V0SWQpLCAzMDAwKTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHNjcmlwdFJlbW90ZSA9IChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGBzY3JpcHRbc3JjPVwiJHtXQVNNUkVNT1RFfVwiXWApIGFzIGFueSBhcyBBcnJheTxIVE1MRWxlbWVudD4pO1xyXG4gICAgICAgIGNvbnN0IHNjcmlwdFJlbW90ZUxhdGVzdCA9IChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGBzY3JpcHRbc3JjPVwiJHtXQVNNUkVNT1RFTEFURVNUfVwiXWApIGFzIGFueSBhcyBBcnJheTxIVE1MRWxlbWVudD4pO1xyXG4gICAgICAgIGlmIChzY3JpcHRSZW1vdGUubGVuZ3RoIHx8IHNjcmlwdFJlbW90ZUxhdGVzdC5sZW5ndGgpIHtcclxuICAgICAgICAgICAgRE9ORSgpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHNjcmlwdFByb2plY3QgPSAoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChgc2NyaXB0W3NyYz1cIiR7V0FTTVBST0pFQ1R9XCJdYCkgYXMgYW55IGFzIEFycmF5PEhUTUxFbGVtZW50Pik7XHJcbiAgICAgICAgICAgIGlmIChzY3JpcHRQcm9qZWN0Lmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgRE9ORSgpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgc2NyaXB0UHJvamVjdC5mb3JFYWNoKGYgPT4gZi5yZW1vdmUoKSk7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVuZGVyZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzY3JpcHQgPSByZW5kZXJlci5jcmVhdGVFbGVtZW50KFwic2NyaXB0XCIpIGFzIEhUTUxTY3JpcHRFbGVtZW50O1xyXG4gICAgICAgICAgICAgICAgICAgIHJlbmRlcmVyLnNldEF0dHJpYnV0ZShzY3JpcHQsIFwic3JjXCIsIGlzTG9hZFdhc21SZW1vdGUgPyBXQVNNUkVNT1RFIDogV0FTTVBST0pFQ1QpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlbmRlcmVyLnNldEF0dHJpYnV0ZShzY3JpcHQsIFwidHlwZVwiLCBcInRleHQvamF2YXNjcmlwdFwiKTtcclxuICAgICAgICAgICAgICAgICAgICByZW5kZXJlci5zZXRBdHRyaWJ1dGUoc2NyaXB0LCBcImFzeW5jXCIsIFwiXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlbmRlcmVyLmFwcGVuZENoaWxkKGRvY3VtZW50LmhlYWQsIHNjcmlwdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgc2NyaXB0Lm9ubG9hZCA9ICgpID0+IERPTkUoKTtcclxuICAgICAgICAgICAgICAgICAgICBzY3JpcHQub25lcnJvciA9ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJldHJ5IDwgMikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuaGVhZC5yZW1vdmVDaGlsZChzY3JpcHQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgTE9BRF9XQVNNX1JFVFJZKHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQVNfQ09NUExFVEUoYXMsIGZhbHNlLCAnQ291bGQgbm90IGxvYWQgc2NyaXB0ICcgKyBpc0xvYWRXYXNtUmVtb3RlID8gV0FTTVJFTU9URSA6IFdBU01QUk9KRUNUKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICByZXRyeSArPSAxO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBtb2QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcclxuICAgICAgICAgICAgICAgICAgICBtb2Quc2V0QXR0cmlidXRlKFwic3JjXCIsIGlzTG9hZFdhc21SZW1vdGUgPyBXQVNNUkVNT1RFIDogV0FTTVBST0pFQ1QpO1xyXG4gICAgICAgICAgICAgICAgICAgIG1vZC5zZXRBdHRyaWJ1dGUoXCJ0eXBlXCIsIFwidGV4dC9qYXZhc2NyaXB0XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIG1vZC5zZXRBdHRyaWJ1dGUoXCJhc3luY1wiLCBcIlwiKTtcclxuICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKG1vZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgbW9kLm9ubG9hZCA9ICgpID0+IERPTkUoKTtcclxuICAgICAgICAgICAgICAgICAgICBtb2Qub25lcnJvciA9ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJldHJ5IDwgMikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuaGVhZC5yZW1vdmVDaGlsZChtb2QpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgTE9BRF9XQVNNX1JFVFJZKHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQVNfQ09NUExFVEUoYXMsIGZhbHNlLCAnQ291bGQgbm90IGxvYWQgc2NyaXB0ICcgKyBpc0xvYWRXYXNtUmVtb3RlID8gV0FTTVJFTU9URSA6IFdBU01QUk9KRUNUKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICByZXRyeSArPSAxO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgTE9BRF9XQVNNX1JFVFJZKCk7XHJcbiAgICByZXR1cm4gYXM7XHJcbn0iXX0=