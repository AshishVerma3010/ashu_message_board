const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const { suite, test } = require('mocha');

//const Thread = require('../models/thread'); 

chai.use(chaiHttp);

suite('Functional Tests', function() {

  let threadId; // To store the ID of a created thread for subsequent tests
  let replyId; // To store the ID of a created reply for subsequent tests

  suite('Threads API Tests', function() {

    test('Creating a new thread: POST request to /api/threads/{board}', function(done) {
      chai.request(server)
        .post('/api/threads/testboard')
        .send({
          text: 'New Thread Text',
          delete_password: 'testpassword'
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.isObject(res.body);
          assert.property(res.body, '_id');
          assert.property(res.body, 'text');
          assert.property(res.body, 'created_on');
          assert.property(res.body, 'bumped_on');
          assert.property(res.body, 'reported');
          assert.property(res.body, 'delete_password');
          assert.property(res.body, 'replies');
          assert.isArray(res.body.replies);
          assert.lengthOf(res.body.replies, 0); // No replies initially
          threadId = res.body._id; // Save thread ID for subsequent tests
          done();
        });
    });

    test('Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}', function(done) {
      chai.request(server)
        .get('/api/threads/testboard')
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.isAtMost(res.body.length, 10); // Maximum 10 threads
          res.body.forEach(thread => {
            assert.property(thread, '_id');
            assert.property(thread, 'text');
            assert.property(thread, 'created_on');
            assert.property(thread, 'bumped_on');
            assert.notProperty(thread, 'reported'); // Should not send 'reported' to client
            assert.notProperty(thread, 'delete_password'); // Should not send 'delete_password' to client
            assert.isArray(thread.replies);
            assert.isAtMost(thread.replies.length, 3); // Maximum 3 replies per thread
            thread.replies.forEach(reply => {
              assert.property(reply, '_id');
              assert.property(reply, 'text');
              assert.property(reply, 'created_on');
              assert.notProperty(reply, 'reported'); // Should not send 'reported' to client
              assert.notProperty(reply, 'delete_password'); // Should not send 'delete_password' to client
            });
          });
          done();
        });
    });

    test('Deleting a thread with the incorrect password: DELETE request to /api/threads/{board}', function(done) {
      chai.request(server)
        .delete('/api/threads/testboard')
        .send({
          thread_id: threadId,
          delete_password: 'wrongpassword'
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'incorrect password');
          done();
        });
    });

    test('Deleting a thread with the correct password: DELETE request to /api/threads/{board}', function(done) {
      chai.request(server)
        .delete('/api/threads/testboard')
        .send({
          thread_id: threadId,
          delete_password: 'testpassword'
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'success');
          done();
        });
    });

    test('Reporting a thread: PUT request to /api/threads/{board}', function(done) {
      chai.request(server)
        .put('/api/threads/testboard')
        .send({ thread_id: threadId })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'reported');
          done();
        });
    });

  });

  suite('Replies API Tests', function() {

    test('Creating a new reply: POST request to /api/replies/{board}', function(done) {
      chai.request(server)
        .post('/api/replies/testboard')
        .send({
          text: 'New Reply Text',
          delete_password: 'replypassword',
          thread_id: threadId
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.isObject(res.body);
          assert.property(res.body, '_id');
          assert.property(res.body, 'text');
          assert.property(res.body, 'created_on');
          assert.property(res.body, 'delete_password');
          replyId = res.body._id; // Save reply ID for subsequent tests
          done();
        });
    });

    test('Viewing a single thread with all replies: GET request to /api/replies/{board}?thread_id={thread_id}', function(done) {
      chai.request(server)
        .get(`/api/replies/testboard?thread_id=${threadId}`)
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.isObject(res.body);
          assert.property(res.body, '_id');
          assert.property(res.body, 'text');
          assert.property(res.body, 'created_on');
          assert.property(res.body, 'replies');
          assert.isArray(res.body.replies);
          res.body.replies.forEach(reply => {
            assert.property(reply, '_id');
            assert.property(reply, 'text');
            assert.property(reply, 'created_on');
          });
          done();
        });
    });

    test('Deleting a reply with the incorrect password: DELETE request to /api/replies/{board}', function(done) {
      chai.request(server)
        .delete('/api/replies/testboard')
        .send({
          thread_id: threadId,
          reply_id: replyId,
          delete_password: 'wrongpassword'
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'incorrect password');
          done();
        });
    });

    test('Deleting a reply with the correct password: DELETE request to /api/replies/{board}', function(done) {
      chai.request(server)
        .delete('/api/replies/testboard')
        .send({
          thread_id: threadId,
          reply_id: replyId,
          delete_password: 'replypassword'
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'success');
          done();
        });
    });

    test('Reporting a reply: PUT request to /api/replies/{board}', function(done) {
      chai.request(server)
        .put('/api/replies/testboard')
        .send({
          thread_id: threadId,
          reply_id: replyId
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'reported');
          done();
        });
    });

  });

});

