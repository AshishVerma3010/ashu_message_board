'use strict';

const Thread = require('../models/thread');

module.exports = function (app) {
  
  // POST a new thread
  app.post('/api/threads/:board', async function(req, res) {
    const { board } = req.params;
    const { text, delete_password } = req.body;

    try {
      const newThread = new Thread({
        board,
        text,
        delete_password,
        replies: []
      });

      await newThread.save();
      res.redirect(`/b/${board}/`);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create new thread' });
    }
  });

  // POST a new reply to a thread
  app.post('/api/replies/:board', async function(req, res) {
    const { board } = req.params;
    const { text, delete_password, thread_id } = req.body;

    try {
      const thread = await Thread.findById(thread_id);
      if (!thread) {
        return res.status(404).json({ error: 'Thread not found' });
      }

      const newReply = {
        text,
        delete_password,
        created_on: new Date(),
        reported: false
      };

      thread.replies.push(newReply);
      thread.bumped_on = new Date();
      await thread.save();
      
      res.redirect(`/b/${board}/${thread_id}`);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to add reply' });
    }
  });

  // GET 10 most recent threads on a board
  app.get('/api/threads/:board', async function(req, res) {
    const { board } = req.params;

    try {
      const threads = await Thread
        .find({ board })
        .sort({ bumped_on: -1 })
        .limit(10)
        .select('-reported -delete_password')
        .populate({
          path: 'replies',
          select: '-reported -delete_password',
          options: { sort: { created_on: -1 }, limit: 3 }
        })
        .exec();

      res.json(threads);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to retrieve threads' });
    }
  });

  // GET a thread with all its replies
  app.get('/api/replies/:board', async function(req, res) {
    const { board } = req.params;
    const { thread_id } = req.query;

    try {
      const thread = await Thread
        .findById(thread_id)
        .select('-reported -delete_password')
        .populate({
          path: 'replies',
          select: '-reported -delete_password',
          options: { sort: { created_on: -1 } }
        })
        .exec();

      if (!thread) {
        return res.status(404).json({ error: 'Thread not found' });
      }

      res.json(thread);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to retrieve thread and replies' });
    }
  });

  // DELETE a thread
  app.delete('/api/threads/:board', async function(req, res) {
    const { board } = req.params;
    const { thread_id, delete_password } = req.body;

    try {
      const thread = await Thread.findById(thread_id);
      if (!thread) {
        return res.status(404).json({ error: 'Thread not found' });
      }

      if (thread.delete_password !== delete_password) {
        return res.json('incorrect password');
      }

      await thread.remove();
      res.json('success');
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to delete thread' });
    }
  });

  // DELETE a reply
  app.delete('/api/replies/:board', async function(req, res) {
    const { board } = req.params;
    const { thread_id, reply_id, delete_password } = req.body;

    try {
      const thread = await Thread.findById(thread_id);
      if (!thread) {
        return res.status(404).json({ error: 'Thread not found' });
      }

      const reply = thread.replies.id(reply_id);
      if (!reply) {
        return res.status(404).json({ error: 'Reply not found' });
      }

      if (reply.delete_password !== delete_password) {
        return res.json('incorrect password');
      }

      reply.text = '[deleted]';
      await thread.save();
      res.json('success');
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to delete reply' });
    }
  });

  // PUT to report a thread
  app.put('/api/threads/:board', async function(req, res) {
    const { board } = req.params;
    const { thread_id } = req.body;

    try {
      const thread = await Thread.findByIdAndUpdate(
        thread_id,
        { reported: true },
        { new: true }
      );

      if (!thread) {
        return res.status(404).json({ error: 'Thread not found' });
      }

      res.json('reported');
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to report thread' });
    }
  });

  // PUT to report a reply
  app.put('/api/replies/:board', async function(req, res) {
    const { board } = req.params;
    const { thread_id, reply_id } = req.body;

    try {
      const thread = await Thread.findById(thread_id);
      if (!thread) {
        return res.status(404).json({ error: 'Thread not found' });
      }

      const reply = thread.replies.id(reply_id);
      if (!reply) {
        return res.status(404).json({ error: 'Reply not found' });
      }

      reply.reported = true;
      await thread.save();
      res.json('reported');
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to report reply' });
    }
  });

};

