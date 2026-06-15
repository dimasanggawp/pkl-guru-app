import JournalReview from '../components/journal/JournalReview';

function Reviews() {
  return (
    <div>
      <p className="kicker mb-1">Aktivitas</p>
      <h2 className="text-2xl sm:text-3xl font-display font-bold mb-4">Review Jurnal</h2>
      <JournalReview />
    </div>
  );
}

export default Reviews;
