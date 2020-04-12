self.addEventListener('message',function(e){
    d_worker = e.data
    var url = '/api/v1/bucket/object/upload/'
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Pragma', 'no-cache');
    xhr.setRequestHeader('Cache-Control', 'no-cache');
    xhr.setRequestHeader('If-Modified-Since', 'Thu, 01 Jun 1970 00:00:00')
    xhr.responseType = 'json';
    var formData = new FormData
    formData.set(e.data['file_name'],e.data['files'])
    formData.set('file_name',e.data['file_name'])
    formData.set('uuid',e.data['uuid'])
    formData.set('bucket_name',e.data['bucket_name'])
    formData.set('chunk_number',e.data['chunk_number'])
    formData.set('index',e.data['index'])

    xhr.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            self.postMessage(this.response)
            self.close
        }
    }

    xhr.upload.onprogress = function (evt) {
        d_worker['size'] = evt.loaded
        self.postMessage(d_worker)
    }
    xhr.send(formData)
},false)