##############################################################################
#
#  Script: Sample Program for Objects
#  Author: Takeo Furukubo
#  Description: Simple CRUD operation (High Level API)
#  Language: Python3
#
##############################################################################

import boto3
import threading
import os
import botocore
from botocore.exceptions import ClientError
from boto3.s3.transfer import S3Transfer
import datetime
from boto3.session import Session
import sys

class Objects_boto3():
    def __init__(self,accesskey,secretkey,endpoint):
        self.accesskey = accesskey
        self.secretkey = secretkey
        self.endpoint = endpoint
        self.SAVE_DIR = '/src/tmp/'
    
    def boto3_session(self):
        #boto3.set_stream_logger()
        #botocore.session.Session().set_debug_logger()
        try:
            #print(self.accesskey,self.secretkey,self.endpoint)
            session = Session(aws_access_key_id=self.accesskey,aws_secret_access_key=self.secretkey)
            s3resource = session.resource('s3',endpoint_url=self.endpoint)
        except ClientError as e:
            print(e)
            return e
        else:
            return s3resource

    def list_bucket(self):
        s3resource = self.boto3_session()
        bucket_list = []
        for bucket in s3resource.buckets.all():
            bucket_list.append(bucket.name)
        return bucket_list

    def create_bucket(self,bucket_name):
        s3resource = self.boto3_session()
        result = s3resource.Bucket(bucket_name).create()
        return result

    def delete_bucket(self,bucket_name):
        s3resource = self.boto3_session()
        result = s3resource.Bucket(bucket_name).delete()
        return result

    def list_object(self,bucket_name):
        s3resource = self.boto3_session()
        object_list = {}
        bucket = s3resource.Bucket(bucket_name)
        for obj in bucket.objects.all():
            object_list[obj.key] = obj.size
        #print(object_list)
        return object_list

    def upload_file(self,bucket_name,file_name):
        s3resource = self.boto3_session()
        local_file = self.SAVE_DIR+file_name
        if os.path.exists(local_file):
            result = s3resource.Bucket(bucket_name).upload_file(local_file,file_name)
            os.remove(local_file)
            return result
        else:
            return('No File Exist. Can not upload')

    def delete_file(self,bucket_name,file_name):
        s3resource = self.boto3_session()
        result = s3resource.Object(bucket_name,file_name).delete()
        return result

    def update_info(self,accesskey,secretkey,endpoint):
        self.accesskey = accesskey
        self.secretkey = secretkey
        self.endpoint = endpoint
    '''
    argv = sys.argv
    if len(argv) == 5:
        bucket_name = argv[2]
        remote_file = argv[3]
        local_file = argv[4]
    if len(argv) == 4:
        bucket_name = argv[2]
        remote_file = argv[3]
    if len(argv) == 3:
        bucket_name = argv[2]

    try:
        
        if argv[1] == 'list':
            for bucket in s3resource.buckets.all():
                print(bucket.name)
                for obj in bucket.objects.all():
                    print("  {}".format(obj.key))

        elif argv[1] == 'create_bucket':
            s3resource.Bucket(bucket_name).create()
        elif argv[1] == "delete_bucket":
            s3resource.Bucket(bucket_name).delete()
        elif argv[1] == "upload":
            file_size = os.path.getsize(local_file)
            s3resource.Bucket(bucket_name).upload_file(local_file,remote_file,Callback=ProgressPercentage(local_file,file_size))
        elif argv[1] == "download":
            file_size = s3resource.Object(bucket_name,remote_file).content_length
            s3resource.Bucket(bucket_name).download_file(remote_file,local_file,Callback=ProgressPercentage(remote_file,file_size))
        elif argv[1] == "delete_file":
            s3resource.Object(bucket_name,remote_file).delete()
        else:
            print("specify the action (list/create_bucket/delete_bucket/upload/download/delete_file)")

    except ClientError as e:
        print("Unexpected error: %s" % e)
'''