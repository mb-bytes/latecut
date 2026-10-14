import pytest
from app.models import FactsObject, MatchMeta, BatterStat, BowlerStat
from app.grounding import check_grounding

@pytest.fixture
def grounding_meta():
    return MatchMeta(
        teams=["Pakistan", "India"],
        venue="Melbourne Cricket Ground",
        date="2022-10-23",
        toss_winner="India",
        toss_decision="field",
        players={
            "Pakistan": ["Babar Azam", "Shaheen Shah Afridi"],
            "India": ["Rohit Sharma", "Virat Kohli", "Hardik Pandya"]
        }
    )

@pytest.fixture
def grounding_facts():
    return FactsObject(
        score=144,
        wickets=4,
        overs="18.0",
        run_rate=8.0,
        required_run_rate=8.0,
        top_batters=[
            BatterStat(name="Virat Kohli", runs=82, balls=53, fours=6, sixes=4, is_out=False),
            BatterStat(name="Hardik Pandya", runs=40, balls=37, fours=1, sixes=2, is_out=True)
        ],
        top_bowlers=[
            BowlerStat(name="Shaheen Shah Afridi", overs="4.0", maidens=0, runs=34, wickets=0, economy=8.5)
        ],
        last_3_overs=[],
        active_partnership=None,
        first_innings_summary=None,
        target=160,
        current_batters=["Virat Kohli", "Dinesh Karthik"],
        current_bowler="Mohammad Nawaz",
        batting_team="India",
        bowling_team="Pakistan"
    )

def test_grounding_valid_output(grounding_facts, grounding_meta):
    output = {
        "story": "India are 144 for 4 in 18 overs chasing 160.",
        "turning_point": "Virat Kohli played a masterclass hitting 82 runs.",
        "watch_next": "India need 16 runs from the final 2 overs."
    }
    result = check_grounding(output, grounding_facts, grounding_meta)
    assert result.grounded is True
    assert len(result.verified_numbers) > 0
    assert len(result.verified_names) > 0

def test_grounding_hallucinated_name(grounding_facts, grounding_meta):
    output = {
        "story": "India are 144 for 4 in 18 overs.",
        "turning_point": "Steve Smith scored a century out of nowhere.",
        "watch_next": "Watch the final 2 overs."
    }
    result = check_grounding(output, grounding_facts, grounding_meta)
    assert result.grounded is False
    assert any(n.value == "Smith" and not n.found for n in result.verified_names)

def test_grounding_hallucinated_number(grounding_facts, grounding_meta):
    output = {
        "story": "India are 999 for 4 in 18 overs.",
        "turning_point": "Virat Kohli hit boundaries.",
        "watch_next": "Watch next."
    }
    result = check_grounding(output, grounding_facts, grounding_meta)
    assert result.grounded is False
    assert any(num.value == "999" and not num.found for num in result.verified_numbers)
