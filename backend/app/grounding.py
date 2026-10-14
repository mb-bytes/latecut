import re
from typing import Dict, Any, Optional, Set, List
from app.models import FactsObject, MatchMeta, GroundingResult, VerifiedItem

COMMON_NON_PLAYER_WORDS = {
    "The", "This", "That", "There", "They", "Then", "With", "After", "Before",
    "Over", "Overs", "Ball", "Balls", "Wicket", "Wickets", "Run", "Runs",
    "Six", "Four", "Boundary", "Boundaries", "Target", "Chase", "Match",
    "Story", "Turning", "Point", "Watch", "Next", "India", "Pakistan",
    "Melbourne", "MCG", "Cup", "World", "T20", "Cricket", "Captain", "Keeper",
    "Keep", "Both", "Stay", "Look", "Now", "Can", "Will", "Since", "While",
    "Still", "Just", "Current", "Final", "First", "Second", "Last", "Great",
    "Big", "Good", "Game", "Action", "Side", "Sides", "Need", "Needs",
    "Won", "Win", "Wins", "Victory", "Presentation", "Award", "Awards",
    "Trophy", "Tournament", "Player", "Players", "Standings", "Defeat",
    "Don", "Insights", "Implications", "Announcement", "Tune", "Tunein",
    "Ab", "Abhi", "Yeh", "Aur", "Lekin", "Kyunki", "Kyun", "Jeet", "Haar", "Bhai", "Khel",
    "Yaar", "Pura", "Main", "Aap", "Aaye", "Gaye", "Gaya", "Chahiye", "Lagta", "Hoga",
    "Khatam", "Jeeta", "Haara", "Dekhein", "Dekho", "Baad", "Kuch", "Sab", "Kaafi",
    "Bohot", "Bahut", "Bas", "Koyi", "Koi", "Nahi", "Tak", "Jahan", "Naam", "Elan",
    "Ek", "Do", "Teen", "Chaar", "Paanch", "Chheh", "Saat", "Aath", "Nau", "Dus"
}

def check_grounding(
    catchup_json: Dict[str, Any],
    facts: FactsObject,
    meta: Optional[MatchMeta] = None,
    moments: Optional[List[Any]] = None
) -> GroundingResult:
    full_text = " ".join([
        str(catchup_json.get("story", "")),
        str(catchup_json.get("turning_point", "")),
        str(catchup_json.get("watch_next", ""))
    ])

    valid_numbers: Set[str] = set()
    valid_numbers.add(str(facts.score))
    valid_numbers.add(str(facts.wickets))
    valid_numbers.add(facts.overs)
    if "." in facts.overs:
        parts = facts.overs.split(".")
        valid_numbers.add(parts[0])
        valid_numbers.add(parts[1])

    valid_numbers.add(str(facts.run_rate))
    valid_numbers.add(str(int(round(facts.run_rate))))

    if facts.required_run_rate is not None:
        valid_numbers.add(str(facts.required_run_rate))
        valid_numbers.add(str(int(round(facts.required_run_rate))))

    if facts.target is not None:
        valid_numbers.add(str(facts.target))
        valid_numbers.add(str(max(0, facts.target - facts.score)))

    for b in facts.top_batters:
        valid_numbers.add(str(b.runs))
        valid_numbers.add(str(b.balls))
        valid_numbers.add(str(b.fours))
        valid_numbers.add(str(b.sixes))

    for bw in facts.top_bowlers:
        valid_numbers.add(str(bw.runs))
        valid_numbers.add(str(bw.wickets))
        valid_numbers.add(str(bw.maidens))
        valid_numbers.add(str(bw.economy))
        valid_numbers.add(bw.overs)

    for ov in facts.last_3_overs:
        valid_numbers.add(str(ov.over_number))
        valid_numbers.add(str(ov.runs))
        valid_numbers.add(str(ov.wickets))

    if facts.active_partnership:
        valid_numbers.add(str(facts.active_partnership.runs))
        valid_numbers.add(str(facts.active_partnership.balls))

    if facts.first_innings_summary:
        valid_numbers.add(str(facts.first_innings_summary.score))
        valid_numbers.add(str(facts.first_innings_summary.wickets))
        valid_numbers.add(facts.first_innings_summary.overs)

    if facts.match_result:
        for num in re.findall(r"\b\d+(?:\.\d+)?\b", facts.match_result):
            valid_numbers.add(num)

    if moments:
        for m in moments:
            m_desc = getattr(m, "description", "") or ""
            m_reason = getattr(m, "reason", "") or ""
            m_ob = getattr(m, "over_ball", "") or ""
            for num in re.findall(r"\b\d+(?:\.\d+)?\b", f"{m_desc} {m_reason} {m_ob}"):
                valid_numbers.add(num)

    for standard_num in ["0", "1", "2", "3", "4", "5", "6", "10", "15", "20", "50", "100"]:
        valid_numbers.add(standard_num)

    extracted_numbers = re.findall(r"\b\d+(?:\.\d+)?\b", full_text)
    verified_numbers = []
    all_numbers_grounded = True

    for num in set(extracted_numbers):
        is_found = (num in valid_numbers)
        if not is_found:
            all_numbers_grounded = False
        verified_numbers.append(VerifiedItem(value=num, found=is_found))

    valid_players: Set[str] = set()
    for b in facts.top_batters:
        valid_players.add(b.name)
        for part in b.name.split():
            if len(part) > 2:
                valid_players.add(part)

    for bw in facts.top_bowlers:
        valid_players.add(bw.name)
        for part in bw.name.split():
            if len(part) > 2:
                valid_players.add(part)

    for p in facts.current_batters:
        valid_players.add(p)
        for part in p.split():
            if len(part) > 2:
                valid_players.add(part)

    if facts.current_bowler:
        valid_players.add(facts.current_bowler)
        for part in facts.current_bowler.split():
            if len(part) > 2:
                valid_players.add(part)

    if meta and meta.players:
        for team_players in meta.players.values():
            for p in team_players:
                valid_players.add(p)
                for part in p.split():
                    if len(part) > 2:
                        valid_players.add(part)

    clean_text = re.sub(r"'\w+", "", full_text)
    capitalized_words = re.findall(r"\b[A-Z][a-z]{2,}\b", clean_text)
    candidate_names = [w for w in capitalized_words if w not in COMMON_NON_PLAYER_WORDS]

    verified_names = []
    all_names_grounded = True

    for name in set(candidate_names):
        is_known = False
        for valid_p in valid_players:
            if name.lower() in valid_p.lower():
                is_known = True
                break

        if is_known:
            verified_names.append(VerifiedItem(value=name, found=True))
        else:
            verified_names.append(VerifiedItem(value=name, found=False))
            all_names_grounded = False

    grounded = all_numbers_grounded and all_names_grounded

    return GroundingResult(
        grounded=grounded,
        verified_numbers=verified_numbers,
        verified_names=verified_names
    )
