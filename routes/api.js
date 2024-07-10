"use strict";

const Thread = require("../models/thread");

module.exports = function (app) {
  app
    .route("/api/threads/:board")
    .post(async function (req, res) {
      const { board } = req.params;
      const { text, delete_password } = req.body;
      try {
        const newThread = new Thread({
          board,
          text,
          delete_password,
          created_on: new Date(),
          bumped_on: new Date(),
          reported: false,
          replies: [],
        });
        const savedThread = await newThread.save();
        res.json(savedThread);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create new thread" });
      }
    })
    .get(async function (req, res) {
      const { board } = req.params;
      try {
        const threads = await Thread.find({ board })
          .sort({ bumped_on: -1 })
          .limit(10)
          .select("-reported -delete_password")
          .lean();

        threads.forEach((thread) => {
          thread.replies = thread.replies.slice(-3).map((reply) => {
            delete reply.reported;
            delete reply.delete_password;
            return reply;
          });
        });

        res.json(threads);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to retrieve threads" });
      }
    })
    .delete(async function (req, res) {
      const { board } = req.params;
      const { thread_id, delete_password } = req.body;
      try {
        const thread = await Thread.findOne({ _id: thread_id, board });
        if (!thread || thread.delete_password !== delete_password) {
          return res.send("incorrect password");
        }
        await Thread.deleteOne({ _id: thread_id });
        res.send("success");
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete thread" });
      }
    })
    .put(async function (req, res) {
      const { board } = req.params;
      const { thread_id } = req.body;
      try {
        const thread = await Thread.findOneAndUpdate(
          { _id: thread_id, board },
          { $set: { reported: true } },
          { new: true }
        );
        if (!thread) return res.send("reported");
        res.send("reported");
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to report thread" });
      }
    });

  app
    .route("/api/replies/:board")
    .post(async function (req, res) {
      const { board } = req.params;
      const { thread_id, text, delete_password } = req.body;
      try {
        const thread = await Thread.findOne({ _id: thread_id, board });
        if (!thread) return res.status(404).json({ error: "Thread not found" });
        const newReply = {
          text,
          created_on: new Date(),
          delete_password,
          reported: false,
        };
        thread.bumped_on = new Date();
        thread.replies.push(newReply);
       const savedreply = await thread.save();
        res.json(savedreply.replies[savedreply.replies.length - 1]);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to add reply" });
      }
    })
    .get(async function (req, res) {
      const { board } = req.params;
      const { thread_id } = req.query;
      try {
        const thread = await Thread.findOne({ _id: thread_id, board })
          .select("-reported -delete_password")
          .lean();
        if (!thread) return res.status(404).json({ error: "Thread not found" });
        thread.replies = thread.replies.map((reply) => {
          delete reply.reported;
          delete reply.delete_password;
          return reply;
        });
        res.json(thread);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to retrieve thread" });
      }
    })
    .delete(async function (req, res) {
      const { board } = req.params;
      const { thread_id, reply_id, delete_password } = req.body;
      try {
        const thread = await Thread.findOne({ _id: thread_id, board });
        if (!thread) return res.send('incorrect password');
        const reply = thread.replies.id(reply_id);
        if (!reply || reply.delete_password !== delete_password) {
          return res.send('incorrect password');
        }
        reply.text = "[deleted]";
        await thread.save();
        res.send('success');
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete reply" });
      }
    })
    .put(async function (req, res) {
      const { board } = req.params;
      const { thread_id, reply_id } = req.body;
      try {
        const thread = await Thread.findOne({ _id: thread_id, board });
        if (!thread) return res.send("reported");
        const reply = thread.replies.id(reply_id);
        if (!reply) return res.send("reported");
        reply.reported = true;
        await thread.save();
        res.send("reported");
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to report reply" });
      }
    });
};

