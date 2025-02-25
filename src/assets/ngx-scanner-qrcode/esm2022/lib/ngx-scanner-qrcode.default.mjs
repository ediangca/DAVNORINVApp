export const WASMPROJECT = "assets/wasm/index.js";
export const WASMREMOTE = "https://cdn.jsdelivr.net/npm/ngx-scanner-qrcode@1.6.9/wasm/index.js";
export const WASMREMOTELATEST = "https://cdn.jsdelivr.net/npm/ngx-scanner-qrcode@latest/wasm/index.js";
export const BEEP = `data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAABQAAAkAAgICAgICAgICAgICAgICAgICAgKCgoKCgoKCgoKCgoKCgoKCgoKCgwMDAwMDAwMDAwMDAwMDAwMDAwMDg4ODg4ODg4ODg4ODg4ODg4ODg4P//////////////////////////AAAAAExhdmM1OC41NAAAAAAAAAAAAAAAACQEUQAAAAAAAAJAk0uXRQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+MYxAANQAbGeUEQAAHZYZ3fASqD4P5TKBgocg+Bw/8+CAYBA4XB9/4EBAEP4nB9+UOf/6gfUCAIKyjgQ/Kf//wfswAAAwQA/+MYxAYOqrbdkZGQAMA7DJLCsQxNOij///////////+tv///3RWiZGBEhsf/FO/+LoCSFs1dFVS/g8f/4Mhv0nhqAieHleLy/+MYxAYOOrbMAY2gABf/////////////////usPJ66R0wI4boY9/8jQYg//g2SPx1M0N3Z0kVJLIs///Uw4aMyvHJJYmPBYG/+MYxAgPMALBucAQAoGgaBoFQVBUFQWDv6gZBUFQVBUGgaBr5YSgqCoKhIGg7+IQVBUFQVBoGga//SsFSoKnf/iVTEFNRTMu/+MYxAYAAANIAAAAADEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV`;
export const MEDIA_STREAM_DEFAULT = {
    audio: false,
    video: true
};
export const CANVAS_STYLES_LAYER = {
    lineWidth: 1,
    strokeStyle: 'green',
    fillStyle: '#55f02880'
};
export const CANVAS_STYLES_TEXT = {
    font: '15px serif',
    strokeStyle: '#fff0',
    fillStyle: '#ff0000'
};
export const CONFIG_DEFAULT = {
    src: '',
    fps: 30,
    vibrate: 300,
    decode: 'utf-8',
    isBeep: true,
    constraints: MEDIA_STREAM_DEFAULT,
    canvasStyles: [CANVAS_STYLES_LAYER, CANVAS_STYLES_TEXT]
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd4LXNjYW5uZXItcXJjb2RlLmRlZmF1bHQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wcm9qZWN0cy9uZ3gtc2Nhbm5lci1xcmNvZGUvc3JjL2xpYi9uZ3gtc2Nhbm5lci1xcmNvZGUuZGVmYXVsdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQSxNQUFNLENBQUMsTUFBTSxXQUFXLEdBQUcsc0JBQXNCLENBQUM7QUFDbEQsTUFBTSxDQUFDLE1BQU0sVUFBVSxHQUFHLHFFQUFxRSxDQUFDO0FBQ2hHLE1BQU0sQ0FBQyxNQUFNLGdCQUFnQixHQUFHLHNFQUFzRSxDQUFDO0FBRXZHLE1BQU0sQ0FBQyxNQUFNLElBQUksR0FBRyxxMUJBQXExQixDQUFDO0FBRTEyQixNQUFNLENBQUMsTUFBTSxvQkFBb0IsR0FBMkI7SUFDMUQsS0FBSyxFQUFFLEtBQUs7SUFDWixLQUFLLEVBQUUsSUFBSTtDQUNaLENBQUM7QUFFRixNQUFNLENBQUMsTUFBTSxtQkFBbUIsR0FBbUM7SUFDakUsU0FBUyxFQUFFLENBQUM7SUFDWixXQUFXLEVBQUUsT0FBTztJQUNwQixTQUFTLEVBQUUsV0FBVztDQUN2QixDQUFBO0FBRUQsTUFBTSxDQUFDLE1BQU0sa0JBQWtCLEdBQW1DO0lBQ2hFLElBQUksRUFBRSxZQUFZO0lBQ2xCLFdBQVcsRUFBRSxPQUFPO0lBQ3BCLFNBQVMsRUFBRSxTQUFTO0NBQ3JCLENBQUE7QUFFRCxNQUFNLENBQUMsTUFBTSxjQUFjLEdBQXdCO0lBQ2pELEdBQUcsRUFBRSxFQUFFO0lBQ1AsR0FBRyxFQUFFLEVBQUU7SUFDUCxPQUFPLEVBQUUsR0FBRztJQUNaLE1BQU0sRUFBRSxPQUFPO0lBQ2YsTUFBTSxFQUFFLElBQUk7SUFDWixXQUFXLEVBQUUsb0JBQW9CO0lBQ2pDLFlBQVksRUFBRSxDQUFDLG1CQUFtQixFQUFFLGtCQUFrQixDQUFDO0NBQ3hELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBTY2FubmVyUVJDb2RlQ29uZmlnIH0gZnJvbSBcIi4vbmd4LXNjYW5uZXItcXJjb2RlLm9wdGlvbnNcIjtcclxuXHJcbmV4cG9ydCBjb25zdCBXQVNNUFJPSkVDVCA9IFwiYXNzZXRzL3dhc20vaW5kZXguanNcIjtcclxuZXhwb3J0IGNvbnN0IFdBU01SRU1PVEUgPSBcImh0dHBzOi8vY2RuLmpzZGVsaXZyLm5ldC9ucG0vbmd4LXNjYW5uZXItcXJjb2RlQDEuNi45L3dhc20vaW5kZXguanNcIjtcclxuZXhwb3J0IGNvbnN0IFdBU01SRU1PVEVMQVRFU1QgPSBcImh0dHBzOi8vY2RuLmpzZGVsaXZyLm5ldC9ucG0vbmd4LXNjYW5uZXItcXJjb2RlQGxhdGVzdC93YXNtL2luZGV4LmpzXCI7XHJcblxyXG5leHBvcnQgY29uc3QgQkVFUCA9IGBkYXRhOmF1ZGlvL21wZWc7YmFzZTY0LFNVUXpCQUFBQUFBQUkxUlRVMFVBQUFBUEFBQURUR0YyWmpVNExqSTVMakV3TUFBQUFBQUFBQUFBQUFBQS8rTTR3QUFBQUFBQUFBQUFBRWx1Wm04QUFBQVBBQUFBQlFBQUFrQUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnS0Nnb0tDZ29LQ2dvS0Nnb0tDZ29LQ2dvS0Nnd01EQXdNREF3TURBd01EQXdNREF3TURBd01EZzRPRGc0T0RnNE9EZzRPRGc0T0RnNE9EZzRQLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9BQUFBQUV4aGRtTTFPQzQxTkFBQUFBQUFBQUFBQUFBQUFDUUVVUUFBQUFBQUFBSkFrMHVYUlFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQS8rTVl4QUFOUUFiR2VVRVFBQUhaWVozZkFTcUQ0UDVUS0Jnb2NnK0J3LzgrQ0FZQkE0WEI5LzRFQkFFUDRuQjkrVU9mLzZnZlVDQUlLeWpnUS9LZi8vd2Zzd0FBQXdRQS8rTVl4QVlPcXJiZGtaR1FBTUE3REpMQ3NReE5PaWovLy8vLy8vLy8vLyt0di8vLzNSV2laR0JFaHNmL0ZPLytMb0NTRnMxZEZWUy9nOGYvNE1odjBuaHFBaWVIbGVMeS8rTVl4QVlPT3JiTUFZMmdBQmYvLy8vLy8vLy8vLy8vLy8vL3VzUEo2NlIwd0k0Ym9ZOS84alFZZy8vZzJTUHgxTTBOM1owa1ZKTElzLy8vVXc0YU15dkhKSlltUEJZRy8rTVl4QWdQTUFMQnVjQVFBb0dnYUJvRlFWQlVGUVdEdjZnWkJVRlFWQlVHZ2FCcjVZU2dxQ29LaElHZzcrSVFWQlVGUVZCb0dnYS8vU3NGU29LbmYvaVZURUZOUlRNdS8rTVl4QVlBQUFOSUFBQUFBREV3TUZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVmA7XHJcblxyXG5leHBvcnQgY29uc3QgTUVESUFfU1RSRUFNX0RFRkFVTFQ6IE1lZGlhU3RyZWFtQ29uc3RyYWludHMgPSB7XHJcbiAgYXVkaW86IGZhbHNlLFxyXG4gIHZpZGVvOiB0cnVlXHJcbn07XHJcblxyXG5leHBvcnQgY29uc3QgQ0FOVkFTX1NUWUxFU19MQVlFUjogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEIHwgYW55ID0ge1xyXG4gIGxpbmVXaWR0aDogMSxcclxuICBzdHJva2VTdHlsZTogJ2dyZWVuJyxcclxuICBmaWxsU3R5bGU6ICcjNTVmMDI4ODAnXHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBDQU5WQVNfU1RZTEVTX1RFWFQ6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCB8IGFueSA9IHtcclxuICBmb250OiAnMTVweCBzZXJpZicsXHJcbiAgc3Ryb2tlU3R5bGU6ICcjZmZmMCcsXHJcbiAgZmlsbFN0eWxlOiAnI2ZmMDAwMCdcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IENPTkZJR19ERUZBVUxUOiBTY2FubmVyUVJDb2RlQ29uZmlnID0ge1xyXG4gIHNyYzogJycsXHJcbiAgZnBzOiAzMCxcclxuICB2aWJyYXRlOiAzMDAsXHJcbiAgZGVjb2RlOiAndXRmLTgnLFxyXG4gIGlzQmVlcDogdHJ1ZSxcclxuICBjb25zdHJhaW50czogTUVESUFfU1RSRUFNX0RFRkFVTFQsXHJcbiAgY2FudmFzU3R5bGVzOiBbQ0FOVkFTX1NUWUxFU19MQVlFUiwgQ0FOVkFTX1NUWUxFU19URVhUXVxyXG59OyJdfQ==