$("body").append('<div style="position:absolute; width:100%; height: 100%; overflow: auto;"><pre id="log" style="white-space: pre-wrap; word-wrap: break-word; padding: 10px; z-index: -1;">Connecting…\n</pre></div>');
var rs = io("http://localhost:9886");
rs.emit("reload");
rs.on('stdout', function(msg) {
    $('#log').append(msg);
});