import json
import os
from flask import Flask, jsonify, request, make_response
import objects_highlevel

#ACCESS_KEY = 'CSv6QuzxwEDUu50iFgEWeInum2uHpNfK'
#SECRET_KEY = 'JIUMcFUybN160Lk0ihgxPsbKu_zwae_y'
#ENDPOINT_URL = 'http://10.149.81.1'
ACCESS_KEY = ''
SECRET_KEY = ''
ENDPOINT_URL = ''

#PORT = int(os.environ['PORT'])
#DEBUG = os.environ['DEBUG'].lower() == 'true'
OBJECT_BOTO3 = objects_highlevel.Objects_boto3(ACCESS_KEY,SECRET_KEY,ENDPOINT_URL)
app = Flask('pdf creator')

#
# Configure KEY
#

@app.route('/api/v1/info/',methods=['PUT'])
def configure_info():
    body = request.get_data().decode().strip()
    d = json.loads(body)
    result = OBJECT_BOTO3.update_info(d['access_key'],d['secret_key'],d['endpoint_url'])
    return jsonify(result)

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

@app.route('/api/v1/bucket/object/upload/<bucket_name>/<file_name>/',methods=['POST'])
def upload_file(bucket_name,file_name):
    file = request.files[file_name]
    file.save(os.path.join('/src/',file_name))
    result = OBJECT_BOTO3.upload_file(bucket_name,file_name)
    return(jsonify(result))

@app.route('/api/v1/bucket/object/delete/<bucket_name>/<file_name>/',methods=['POST'])
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
    app.run(debug='true', host='0.0.0.0', port=80)
