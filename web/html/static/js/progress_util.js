let test_script = function(child){
    txt = '<p>AAAAAAAAAAAA</p><div id="pgb"></div><div id="lbl"></div></div>'
    //child = progress_window()
    child.onload = function(){
        $('#progress_bar',child.document).append(txt)
        console.log(txt)
        tag = '#pgb'
        $(tag,child.document).progressbar({
            value: 0,
            max:100,
            change: function(){
            var v = $("#pgb",child.document).progressbar("value");
            $("#lbl",child.document).text(v + "%");
            },
            complete: function(){
            $("#lbl",child.document).text("完了しました");
            }
            })
            
            i=0
            timer = setInterval(function(){
                if(i <= 50){
                    $('#pgb',child.document).progressbar('value',i)
                    i+=10
                }else{
                    clearInterval(timer)
                }
            },500)
            
    }
    //return child
}

let progress_window = function(){
    child = window.open('progress.html','_blank','width=500,height=500,scrollbars=1,location=0,menubar=0,toolbar=0,status=1,directories=0,resizable=1,left='+(window.screen.width-500)/2+',top='+(window.screen.height-500)/2)
    
    /*child.onload = function(){
        $("#pgb",child.document).progressbar({
            value: 0,
            max:100,
            change: function(){
            var v = $("#pgb",child.document).progressbar("value");
            $("#lbl",child.document).text(v + "%");
            },
            complete: function(){
            $("#lbl",child.document).text("完了しました");
            }
            })
        
    }*/
    return child
}

let p_test = function(){
    

            $("#pgb").progressbar({
            value: 0,
            max:100,
            change: function(){
            var v = $("#pgb").progressbar("value");
            $("#lbl").text(v + "%");
            },
            complete: function(){
            $("#lbl").text("完了しました");
            }
            })
}
let progress_test = function(){
    $('pgb').progressbar('value',50)
    /*
    $("#pr").progressbar({
        value: 0,
        max:100,
        change: function(){
          var v = $("#pr").progressbar("value");
          $("#lb").text(v + "%");
        },
        complete: function(){
          $("#lb").text("完了しました");
        }
      })
      i = 1
    timer = setInterval(function(){
        if(i <= 100){
            $('#pr').progressbar('value',i)
            i+=10
        }else{
            clearInterval(timer)
        }
    },500)*/
}
