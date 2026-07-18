import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' }
});

const Ledger = mongoose.model('TestLedger', schema);

async function run() {
  await mongoose.connect('mongodb+srv://user:pass@cluster.mongodb.net/test', { useNewUrlParser: true, useUnifiedTopology: true }).catch(() => {});
  // Wait, I can't connect to a real DB without credentials.
  // I'll just check Mongoose code or use another way.
}
run();
