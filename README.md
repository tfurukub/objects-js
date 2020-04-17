Nutanix Object Manager
====

Overview
- Display Dashboard
- CRUD of Bucket and Object
- Upload/Download of Multiple Objects

## Install
1. rename "dummy.json" to "secret.json"
2. Input the correct information of Nutanix Objects in "secret.json"
3. On Docker VM,
    3-1 git clone https://github.com/tfurukub/objects-js
    3-2 cd ./objects-js
    3-3 docker-compose up -d --build
4. Access to http://<Docker VM IP address>
