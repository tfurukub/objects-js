let create_bucket = function(){
  $('.modal-content').css('height','200px')
  $('#create_bucket_modal').modal('show')
}

let input_bucket_name = function(){
  var bucket_name = $('#create_bucket_text').val()
  $.ajax({type:'put', url:'/api/v1/bucket/'+bucket_name,
    success:function(j, status, xhr){
      bucket_list_updated()
      $('#create_bucket_text').val('')
      alert(bucket_name+' is successfully created')
    }, 
    error:function(j){
      alert(JSON.parse(unescape(j['responseText']))['Error']['Message'])
      $('#create_bucket_text').val('')
    }
  })
}

let delete_bucket = function(){
  checked = $("input[name=b_chk]:checked")
  if(checked.length == 0){
    alert('Please select files')
  }else if(checked.length > 1){
    alert('Please select only one bucket')
  }else{
    bucket_name = checked.val()
    $.ajax({type:'delete', url:'/api/v1/bucket/'+bucket_name,
      success:function(j, status, xhr){
        bucket_list_updated()
        alert(bucket_name+' is successfully deleted')
      }, 
      error:function(j){
        alert(JSON.parse(unescape(j['responseText']))['Error']['Message'])
      }
    })
  }
}

let upload_files = function(){
  var files = $.extend(true,{},this.files)
  $('#upload_file').val('')
  if(files.length == 0){
    alert('Please select at least 1 file')
  }
  pgb_initialize(files)
  open_modal(files.length)
  var d = {}
  // Loup for each file
  for(k=0;k<files.length;k++){
    var file_name = files[k].name
    var file_size = files[k].size
    var file = files[k]
    // chunk_size must be equal or larger than 5MiB because of S3 multipart upload limitation
    var chunk_size = 5*1024*1024
    var chunk_number = Math.ceil(file.size/chunk_size)
    var slice_index = 0
    var uuid = generateUuid()
    var selected_bucket = $('#object_list_wrapper').val()
    d1 = {}
    d1['file_name'] = file_name
    d1['file_size'] = file_size
    d1['chunk_size'] = chunk_size
    d1['chunk_number'] = chunk_number
    d1['slice_index'] = slice_index
    d1['num'] = k
    d1['bucket_name'] = selected_bucket
    d1['uuid'] = uuid
    d1['sent_bytes'] = {}
    d[uuid] = d1

    // Initialize Upload
    url_option = selected_bucket + '/' + file_name + '/' + uuid + '/upload/'

    $.ajax({type:'put',url:'/api/v1/init/'+url_option,
      success:function(j){
        // Start Upload after initialization
        d2 = d[j['uuid']]
        d2['progress'] = 0
        // Loup for each chunk
        for(i=0;i<d2['chunk_number'];i++){
          file_part = files[d2['num']].slice(d2['slice_index'],d2['slice_index']+d2['chunk_size'])
          d2['files'] = file_part
          d2['index'] = i
          d2['sent_bytes'][i] = 0
          upload_threading(d2)
          d2['slice_index'] += d2['chunk_size']
        }
      },
      error:function(j){
        console.log(j)
        alert('Failed to Initialize')
      }
    })
  }
}

let upload_threading = function(d2){
  var worker = new Worker('/static/js/worker.js')
    worker.addEventListener('message', function(e) {
      if(e.data.ETag){
        pgb_update(100,e.data.Key)
        object_list_updated(d2['bucket_name'])
        //console.log('finished',e.data)
      }else{
        d2['sent_bytes'][e.data.index] = e.data.size
        //console.log(d2['sent_bytes'],d2['file_name'])
        total_bytes = 0
        obj = d2['sent_bytes']
        Object.keys(obj).forEach(function(key){
          total_bytes += obj[key]                
        })
        p = parseInt(total_bytes/d2['file_size']*100).toFixed(0)
        if(p >= 100){
          p = 100
        }
        pgb_update(p,e.data.file_name)
        //console.log(e.data)
      }
    }, false)
    worker.postMessage(d2)
}

let download_files = function(){
  files = []
  i = 0
  selected_bucket = $('#object_list_wrapper').val()
  checked = $("input[name=o_chk]:checked")
  if(checked.length == 0){
    alert('Please select files')
  }else{
    download_files_continue()
  }
}

let download_files_continue = function(){
  files = []
  i = 0
  selected_bucket = $('#object_list_wrapper').val()
  checked = $("input[name=o_chk]:checked")
  checked.each(function(){
    f = $(this).val()
    files[i] = {'name':f}
    i++
    
  })
  pgb_initialize(files)
  open_modal(checked.length)
  uuid_list = {}
  checked.each(function(){
    f = $(this).val()
    uuid = generateUuid()
    uuid_list[f] = uuid
    url_option = selected_bucket + '/' + f + '/' + uuid + '/download/'
    $.ajax({type:'put',url:'/api/v1/init/'+url_option,
      success:function(j){
        url_option = selected_bucket+'/'+ j['file_name'] + '?uuid='+j['uuid']
        $.ajax({type:'put',url:'/api/v1/bucket/object/download/'+url_option})
        check_download_status(selected_bucket,j['file_name'],j['uuid'])
        
      },
      error:function(j){
        console.log(j)
        alert('Failed to Initialize')
      }
    })
  })
}

let send_download_request = function(f,uuid){
  selected_bucket = $('#object_list_wrapper').val()
  //check_download_status(selected_bucket,f)
  var url = '/api/v1/bucket/object/download/'+selected_bucket+'/'+f + '?uuid='+uuid
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.setRequestHeader('Pragma', 'no-cache');
  xhr.setRequestHeader('Cache-Control', 'no-cache');
  xhr.setRequestHeader('If-Modified-Since', 'Thu, 01 Jun 1970 00:00:00')
  xhr.responseType = 'blob';
  
  xhr.onprogress = function (evt) {
    if(this.status == 200){
      var load = (100*evt.loaded/evt.total|0)/2+50
      pgb_update(load,f)
      //console.log('in xhr.onprogress',load,f)
      if(parseInt(load).toFixed(0) == 100){
        url_option = selected_bucket+'/'+ f + '?uuid='+uuid
        $.ajax({type:'delete',url:'/api/v1/bucket/object/download/'+url_option})
      }
    }else{
      alert('Download Failed. File Name = '+f)
    }
  };
  
  xhr.onreadystatechange = function (e) {
    if (this.readyState == 4 && this.status == 200) {
      var blob = this.response;
      //IE, Edge とその他で処理の切り分け
      if (window.navigator.msSaveBlob) {
        window.navigator.msSaveBlob(blob, f);
      } else {
        var a = document.createElement("a");
        var url = window.URL;
        a.href = url.createObjectURL(new Blob([blob],
                                    { type: blob.type }));
        document.body.appendChild(a);
        a.style = "display: none";
        a.download = f
        a.click();
        document.body.removeChild(a)
      }
    }
    
  }
  xhr.send()
}

let check_download_status= function(selected_bucket,file_name,uuid){
  var timer = {}
  p = 0
  url_option = selected_bucket+'/'+file_name + '?uuid='+uuid
  $.ajax({type:'get',url:'/api/v1/bucket/object/download/status/'+url_option,
    success: function(j){
      if(j['progress'] == String(100)){
        pgb_update(50,file_name)
        send_download_request(file_name,uuid)
      }else{
        p = parseInt((j['progress']).toFixed(0))/2
        pgb_update(p,file_name)
        check_download_status(selected_bucket,file_name,uuid)
      }
    }
  })
}

let delete_files = function(){
  if($("input[name=o_chk]:checked").length == 0){
    alert('Please select files')
  }
  selected_bucket = $('#object_list_wrapper').val()
  $("input[name=o_chk]:checked").each(function(){
    f = $(this).val()
    $.ajax({type:'post', url:'/api/v1/bucket/object/delete/'+selected_bucket+'/'+f,
      success:function(j, status, xhr){
        object_list_updated(selected_bucket)
      }, 
      error:function(j){
        console.log(j)
      }
    })
  })
}

let bucket_list_updated = function(){
  $('#bucket_table').DataTable().ajax.reload()
  $('#object_table').DataTable().columns.adjust()
}

let back_to_bucket_list = function(){
  $('#object_list_wrapper').hide()
  $('input[name=o_chk]').prop('checked',false)
  $('#bucket_table').DataTable().ajax.reload()
  $('#bucket_list_wrapper').show()
  $('#bucket_table').DataTable().columns.adjust()
}

let bucket_clicked = function(bucket_name){
  $('#object_table').DataTable().ajax.url('/api/v1/bucket/object/'+bucket_name+'/')
  $('#object_table').DataTable().ajax.reload(function(){
    $('#object_list_wrapper').val(bucket_name)
    $('#bucket_list_wrapper').hide()
    $('input[name=b_chk]').prop('checked',false)
    $('#object_list_wrapper').show()
    $('#object_table').DataTable().columns.adjust()
  })
}

let object_list_updated = function(bucket_name){
  $('#object_table').DataTable().ajax.url('/api/v1/bucket/object/'+bucket_name+'/')
  $('#object_table').DataTable().ajax.reload()
}

let object_list_updated_wrapper = function(){
  bucket_name = $('#object_list_wrapper').val()
  object_list_updated(bucket_name)
}
let get_server_info = function(){
  $.ajax({type:'put', url:'/api/v1/connect/',
    success: function(j){
      $('#connect_objects').text('Connect to '+j['endpoint_url'])
    },
    error: function(j){
      alert(j['responseJSON']['error'])
    }
  })
}
let connect_objects = function(){
  var button = $(this);
  button.attr("disabled", true)
  dispLoading($('#connect_objects').text().replace('Connect','Connecting'))
  
  $.ajax({type:'get', url:'/api/v1/bucket/',
    success:function(j, status, xhr){
      Initialize_datatables()     
      removeLoading()
      button.attr("disabled", false)
      $('#bucket_table').DataTable().ajax.url('/api/v1/bucket/info/')
      $('#bucket_table').DataTable().ajax.reload(function(){
        $('#bucket_list_wrapper').show()
        $('#bucket_table').DataTable().columns.adjust()
      })
    }, 
    error:function(j,status){
      alert(JSON.parse(unescape(j['responseText']))['Error']['Message'])
    }
  })
}

let Initialize_datatables = function(){
   // Initialize DataTables
   $('#bucket_table').DataTable({
    "ajax": '/api/v1/dummy/',
    'columnDefs': [{
        'targets': 0,
        'width': '10px',
        'searchable': false,
        'orderable': false,
        'className': 'dt-body-center',
        'render': function (data, type, full, meta){
            return '<input type="checkbox" name="b_chk" value="' + data + '">'
        }
     },
     {
      'targets': 1,
      //'searchable': false,
      //'orderable': false,
      //'className': 'dt-body-center',
      'render': function (data){
          return '<a href=\"javascript:bucket_clicked(\''+data+'\')\">'+data+'</a>'
      }
   }
    ],
    'order': [[1, 'asc']],
  })

  $('#object_table').DataTable({
    "ajax": '/api/v1/dummy/',
    'columnDefs': [{
        'targets': 0,
        'width': '10px',
        'searchable': false,
        'orderable': false,
        'className': 'dt-body-center',
        'render': function (data){
            return '<input type="checkbox" name="o_chk" value="' + data + '">';
        }
     },
      {
        'targets': 2,
        'type': 'file-size'
      },
      {
        'targets': 3,
        'render': function (data){
          moment.locale("ja")
          m = moment.unix(data).format("LLLL")
          return '<p style="display: none">' + data + '</p>' + m
        }
      }
    ],
    'order': [[1, 'asc']]
  })
}