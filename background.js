chrome.webRequest.onCompleted.addListener(function(details) {
  chrome.tabs.executeScript(details.tabId, {
  // Code has to be injected right into page (not via <script src="...">),
  // because it needs to be executed after initAddMedia is declared (in page.js),
  // but before it is called (in IM.init, which is called from script embedded into page)
    code: "var e = document.createElement('script');e.innerHTML = '\
function performInjection() {\
  var __initAddMedia = initAddMedia;\
  initAddMedia = function(lnk, previewId, mediaTypes, opts) {\
    if (true || opts.mail) {\
      mediaTypes.push([\"photo\",\"denull_webcam\"]);\
      var addMedia = __initAddMedia(lnk, previewId, mediaTypes, opts);\
      return addMedia;\
    } else {\
      return __initAddMedia.apply(this, arguments);\
    }\
  };\
  var __initCustomMedia = initCustomMedia;\
  initCustomMedia = function(lnk, types, opts) {\
    for (var i = 0; i < types.length; i++) {\
      if (types[i][1] == \"denull_webcam\") {\
        if (types.length < 9) {\
          opts.hideItem = 100;\
        }\
        types[i][1] = \"Снимок\";\
        types[i][3] = function(e) {\
          var box = new MessageBox({ width: 828, onDestroy: function() {\
            if (localMediaStream) {\
              localMediaStream.stop();\
            }\
            box = false;\
          }}, true);\
          var video, canvas, timer;\
          box.content(\"<div id=denull_timer></div><video id=denull_video width=800 height=600 autoplay></video><canvas id=denull_canvas width=800 height=600></canvas>\");\
          box.addButton(\"Отмена\", function() {\
            box.hide(); box.destroy();\
          });\
          var takePhoto = function() {\
            if (localMediaStream) {\
              ctx.drawImage(video, 0, 0, 800, 600);\
              var png = canvas.toDataURL(\"image/png\").split(\",\");\
              var binary = atob(png[1]);\
              var array = new Array(binary.length);\
              for (var j = 0; j < binary.length; j++) {\
                array[j] = binary.charCodeAt(j);\
              }\
              var blob = new Blob([new Uint8Array(array)], { type: \"image/png\", encoding: \"utf-8\" });\
              blob.fileName = \"photo.png\";\
              localMediaStream.stop();\
              var bbox = showBox(\"al_photos.php\", {act: \"choose_photo\", max_files: 10}, {stat: [\"photos.js\", \"upload.js\"], onDone: function() {\
                if (!bbox) return;\
                var __FormData = window.FormData;\
                window.FormData = function() {\
                  var obj = new __FormData();\
                  var __append = obj.append;\
                  obj.append = function(name, file) {\
                    return __append.call(this, name, file, \"photo.png\");\
                  };\
                  return obj;\
                };\
                Upload.onFileApiSend(cur.uplId, [blob]);\
                window.FormData = __FormData;\
                var animStep = 0;\
                var animTimer = setInterval(function() {\
                  animStep++;\
                  if (animStep >= 11) {\
                    clearInterval(animTimer);\
                    box.hide(); box.destroy();\
                    bbox.hide(); bbox.destroy();\
                  } else {\
                    video.style.opacity = (animStep < 6) ? ((5 - animStep) / 5) : ((animStep - 5) / 5);\
                  }\
                }, 40);\
              }});\
              bbox.show();\
            };\
          };\
          box.addButton(\"С задержкой (3 сек)\", function() {\
            var second = 0;\
            var tick = function() {\
              second++;\
              if (second == 4) {\
                timer.style.display = \"none\";\
                clearInterval(photoTimer);\
                takePhoto();\
              } else {\
                timer.innerHTML = \
                  (second == 1 ? \"<font color=white>1</font>\" : \"1\") + \" \" +\
                  (second == 2 ? \"<font color=white>2</font>\" : \"2\") + \" \" +\
                  (second == 3 ? \"<font color=white>3</font>\" : \"3\");\
              }\
            };\
            var photoTimer = setInterval(tick, 1000);\
            tick();\
            timer.style.display = \"block\";\
          });\
          box.addButton(\"Сделать снимок\", takePhoto, \"yes\");\
          box.show();\
          video = ge(\"denull_video\");\
          video.style.background = \"#000\";\
          timer = ge(\"denull_timer\");\
          timer.style.display = \"none\";\
          timer.style.position = \"absolute\";\
          timer.style.top = \"540px\"; timer.style.left = \"324px\";\
          timer.style.color = \"#666\";\
          timer.style.width = \"140px\"; timer.style.lineHeight = \"60px\";\
          timer.style.fontSize = \"48px\";\
          timer.style.textAlign = \"center\";\
          timer.style.background = \"rgba(0,0,0,0.75)\";\
          timer.style.borderRadius = \"3px\";\
          canvas = ge(\"denull_canvas\");\
          canvas.style.display = \"none\";\
          var ctx = canvas.getContext(\"2d\");\
          var localMediaStream = false;\
          navigator.webkitGetUserMedia({ video: true }, function(stream) {\
            video.src = window.URL.createObjectURL(stream);\
            localMediaStream = stream;\
            if (!box) {\
              stream.stop();\
            }\
          }, function(error) {\
            topError(\"Ошибка при попытке начать захват видео с вебкамеры:<br/>\" + error);\
          });\
        };\
      }\
    }\
    return __initCustomMedia(lnk, types, opts);\
  };\
  try {cur.imMedia = initAddMedia(\"im_add_media_link\", \"im_media_preview\", [[\"photo\", getLang(\"profile_wall_photo\")], [\"video\", getLang(\"profile_wall_video\")], [\"audio\", getLang(\"profile_wall_audio\")], [\"doc\", getLang(\"profile_wall_doc\")], [\"map\", getLang(\"profile_wall_map\")], [\"gift\", getLang(\"profile_wall_gift\")]], {mail: 1, onCheckURLDone: IM.onUploadDone});}catch(e){};\
};\
if (window.initAddMedia) {\
  console.log(\"injected WebCam photos instantly\");\
  performInjection();\
} else {\
  var __try = 0;\
  var __timer = setInterval(function() {\
    __try++;\
    if (window.initAddMedia) {\
      console.log(\"injected WebCam photos after \" + __try + \" tries\");\
      clearInterval(__timer);\
      performInjection();\
    }\
  }, 100);\
}\
    ';document.head.appendChild(e);",
    runAt: "document_start"
  });
},
{
  urls: [
    "*://*.vk.me/js/al/page.js*",
    "*://*.vk.com/js/al/page.js*"
  ],
  types: ["script"]
});