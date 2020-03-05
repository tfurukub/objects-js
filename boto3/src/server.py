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
    OBJECT_BOTO3.update_info(d['access_key'],d['secret_key'],d['endpoint_url'])
    print(d)
    return (jsonify({}), 200)

#
# Bucket
#

@app.route('/api/v1/bucket/',methods=['GET'])
def bucket_list():
    print(OBJECT_BOTO3.accesskey,OBJECT_BOTO3.secretkey,OBJECT_BOTO3.endpoint)
    s3resource = OBJECT_BOTO3.boto3_session()
    b_list = OBJECT_BOTO3.list_bucket(s3resource)
    print(b_list)
    return jsonify(b_list)

@app.route('/api/v1/bucket/object/<bucket_name>/',methods=['GET'])
def object_list(bucket_name):
    s3resource = OBJECT_BOTO3.boto3_session()
    o_list = OBJECT_BOTO3.list_object(s3resource,bucket_name)
    return jsonify(o_list)


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
