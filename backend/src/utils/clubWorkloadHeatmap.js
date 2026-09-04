const { scoreWorkload } = require('./workloadAssignment');
const { bandFor } = require('./crossClubWorkload');

// Same absolute reference point used for the cross-club "My Total Load"
// view (12 "hours" of urgency-weighted score, roughly two demanding days'
// worth of work). Using an ABSOLUTE reference here — not the club's own
// max score — matters: banding against the busiest person in the club
// would always paint someone as HIGH even if the whole club is relaxed,
// since the top scorer's ratio-to-max is always 1.0 by definition.
const CLUB_HEATMAP_REFERENCE = 12;

function buildClubHeatmap(clubMembers, allOpenTasksAcrossClub) {
  const scored = clubMembers.map((member) => scoreWorkload(member, allOpenTasksAcrossClub));

  return scored
    .map((s) => ({ ...s, band: bandFor(s.workloadScore, CLUB_HEATMAP_REFERENCE) }))
    .sort((a, b) => b.workloadScore - a.workloadScore);
}

module.exports = { buildClubHeatmap, CLUB_HEATMAP_REFERENCE };
