import json
import os
import re
import shutil
from flask import Flask, jsonify, request, make_response,send_from_directory
import objects_highlevel

ACCESS_KEY = ''
SECRET_KEY = ''
ENDPOINT_URL = ''
UPLOAD_SAVE_DIR = '/src/upload/'
DOWNLOAD_SAVE_DIR = '/src/download/'
SECRET_FILE = 'secret.json'

#PORT = int(os.environ['PORT'])
#DEBUG = os.environ['DEBUG'].lower() == 'true'



OBJECT_BOTO3 = objects_highlevel.Objects_boto3(ACCESS_KEY,SECRET_KEY,ENDPOINT_URL,UPLOAD_SAVE_DIR,DOWNLOAD_SAVE_DIR)
app = Flask('pdf creator')

#
# Configure KEY
#

@app.route('/api/v1/info/',methods=['PUT'])
def configure_info():
    body = request.get_data().decode().strip()
    
    if os.path.isfile(os.path.join('/src/',SECRET_FILE)):
        with open(os.path.join('/src/',SECRET_FILE),'r') as f:
            d = json.load(f)
    else:
        d = json.loads(body)
    print(d)
    OBJECT_BOTO3.update_info(d['access_key'],d['secret_key'],d['endpoint_url'])
    return jsonify({},200)

#
# Bucket
#

@app.route('/api/v1/bucket/',methods=['GET'])
def bucket_list():
    b_list = OBJECT_BOTO3.list_bucket()
    return jsonify(b_list)

@app.route('/api/v1/bucket/object/<bucket_name>/',methods=['GET'])
def object_list(bucket_name):
    o_list = OBJECT_BOTO3.list_object(bucket_name)
    return jsonify(o_list)

@app.route('/api/v1/bucket/<bucket_name>',methods=['PUT','DELETE'])
def buckets(bucket_name):
    if request.method == 'PUT':
        result = OBJECT_BOTO3.create_bucket(bucket_name)
        return jsonify(result)
    if request.method == 'DELETE':
        result = OBJECT_BOTO3.delete_bucket(bucket_name)
        return jsonify(result)

@app.route('/api/v1/bucket/object/upload/<bucket_name>/<file_name>',methods=['POST'])
def upload_file(bucket_name,file_name):
    if os.path.isdir(UPLOAD_SAVE_DIR) == False:
        os.mkdir(UPLOAD_SAVE_DIR)
    file = request.files[file_name]
    file_name = request.args.get('index')+'_'+file_name
    file.save(os.path.join(UPLOAD_SAVE_DIR,file_name))
    print('saved !!!')
    
    #result = OBJECT_BOTO3.upload_file(bucket_name,file_name)
    result = ''
    return(jsonify(result))

@app.route('/api/v1/bucket/object/concat/<bucket_name>/<file_name>',methods=['GET','POST'])
def concat_file(bucket_name,file_name):
    files = os.listdir(UPLOAD_SAVE_DIR)
    filepath = os.path.join(UPLOAD_SAVE_DIR,file_name)
    
    if request.method == 'POST':
        chunk_number = int(request.args.get('num'))
        files_ordered = []
        for i in range(chunk_number):
            sliced_filename = str(i)+'_'+file_name
            if sliced_filename in files:
                files_ordered.append(sliced_filename)
            else:
                for item in files_ordered:
                    os.remove(os.path.join(UPLOAD_SAVE_DIR,item))
                return(jsonify({'error':'Files not sent correctly'}))
        
        
        with open(filepath,'wb') as savefile:
            for i in range(chunk_number):
                data = open(os.path.join(UPLOAD_SAVE_DIR,files_ordered[i]),'rb').read()
                savefile.write(data)
                savefile.flush()
                print(os.path.join(UPLOAD_SAVE_DIR,files_ordered[i]))
        result = OBJECT_BOTO3.upload_file(bucket_name,file_name)

        for item in files_ordered:
            os.remove(os.path.join(UPLOAD_SAVE_DIR,item))
        return(jsonify(result))

    if request.method == 'GET':
        print('file num=',len(files))
        concat_size = 0
        p = objects_highlevel.percentage
        
        if os.path.isfile(filepath):
            concat_size = os.path.getsize(filepath)
        elif p != 0:
            return(jsonify({'num':len(files),'concat_size':request.args.get('size'),'s3_progress':p}),200)
        print(concat_size,p)
        return(jsonify({'num':len(files),'concat_size':concat_size,'s3_progress':p}),200)

@app.route('/api/v1/bucket/object/download/<bucket_name>/<file_name>',methods=['GET'])
def download_file(bucket_name,file_name):
    result = OBJECT_BOTO3.download_file(bucket_name,file_name)
    return send_from_directory(DOWNLOAD_SAVE_DIR, file_name,as_attachment = True, attachment_filename = file_name)

@app.route('/api/v1/bucket/object/delete/<bucket_name>/<file_name>',methods=['POST'])
def delete_file(bucket_name,file_name):
    result = OBJECT_BOTO3.delete_file(bucket_name,file_name)
    return jsonify(result)

#
# util
#


@app.errorhandler(404)
def api_not_found_error(error):
    """General 404 error."""
    return (jsonify({'error': "api not found", 'code': 404}), 404)


@app.errorhandler(405)
def method_not_allowed_error(error):
    """General 405 error."""
    return (jsonify({'error': 'method not allowed', 'code': 405}), 405)


@app.errorhandler(500)
def internal_server_error(error):
    """General 500 error."""
    return (jsonify({'error': 'server internal error', 'code': 500}), 500)


if __name__ == '__main__':
    #app.run(debug=DEBUG, host='0.0.0.0', port=PORT)
    if os.path.isdir(UPLOAD_SAVE_DIR):
        shutil.rmtree(UPLOAD_SAVE_DIR)
    if os.path.isdir(DOWNLOAD_SAVE_DIR):
        shutil.rmtree(DOWNLOAD_SAVE_DIR)

    os.mkdir(UPLOAD_SAVE_DIR)
    os.mkdir(DOWNLOAD_SAVE_DIR)
    app.run(debug='true', host='0.0.0.0', port=80)
