import pytest
from app.models import BallEvent, MatchMeta
from app.facts_extractor import (
    compute_overs_str,
    compute_overs_decimal,
    extract_batter_stats,
    extract_bowler_stats,
    extract_active_partnership,
    extract_facts
)

@pytest.fixture
def sample_match_meta():
    return MatchMeta(
        teams=["Pakistan", "India"],
        venue="Melbourne Cricket Ground",
        date="2022-10-23",
        toss_winner="India",
        toss_decision="field",
        players={
            "Pakistan": ["Babar Azam", "Mohammad Rizwan", "Shan Masood"],
            "India": ["Rohit Sharma", "KL Rahul", "Virat Kohli", "Hardik Pandya"]
        }
    )

@pytest.fixture
def sample_events():
    return [
        BallEvent(
            index=0,
            innings=2,
            over=0,
            ball=1,
            batter="Rohit Sharma",
            bowler="Shaheen Shah Afridi",
            non_striker="KL Rahul",
            runs_batter=4,
            runs_extras=0,
            runs_total=4,
            is_wicket=False,
            running_score=4,
            running_wickets=0,
            target=160
        ),
        BallEvent(
            index=1,
            innings=2,
            over=0,
            ball=2,
            batter="Rohit Sharma",
            bowler="Shaheen Shah Afridi",
            non_striker="KL Rahul",
            runs_batter=0,
            runs_extras=0,
            runs_total=0,
            is_wicket=True,
            wicket_kind="lbw",
            player_out="Rohit Sharma",
            running_score=4,
            running_wickets=1,
            target=160
        ),
        BallEvent(
            index=2,
            innings=2,
            over=0,
            ball=3,
            batter="Virat Kohli",
            bowler="Shaheen Shah Afridi",
            non_striker="KL Rahul",
            runs_batter=6,
            runs_extras=0,
            runs_total=6,
            is_wicket=False,
            running_score=10,
            running_wickets=1,
            target=160
        ),
        BallEvent(
            index=3,
            innings=2,
            over=0,
            ball=4,
            batter="Virat Kohli",
            bowler="Shaheen Shah Afridi",
            non_striker="KL Rahul",
            runs_batter=1,
            runs_extras=0,
            runs_total=1,
            is_wicket=False,
            running_score=11,
            running_wickets=1,
            target=160
        ),
        BallEvent(
            index=4,
            innings=2,
            over=0,
            ball=5,
            batter="KL Rahul",
            bowler="Shaheen Shah Afridi",
            non_striker="Virat Kohli",
            runs_batter=4,
            runs_extras=0,
            runs_total=4,
            is_wicket=False,
            running_score=15,
            running_wickets=1,
            target=160
        ),
        BallEvent(
            index=5,
            innings=2,
            over=0,
            ball=6,
            batter="KL Rahul",
            bowler="Shaheen Shah Afridi",
            non_striker="Virat Kohli",
            runs_batter=1,
            runs_extras=0,
            runs_total=1,
            is_wicket=False,
            running_score=16,
            running_wickets=1,
            target=160
        )
    ]

def test_overs_formatting():
    assert compute_overs_str(0, 3) == "0.3"
    assert compute_overs_str(0, 6) == "1.0"
    assert compute_overs_str(14, 2) == "14.2"
    assert compute_overs_decimal(0, 6) == 1.0
    assert pytest.approx(compute_overs_decimal(0, 3)) == 0.5

def test_extract_batter_stats(sample_events):
    batters = extract_batter_stats(sample_events)
    assert len(batters) == 3
    kohli = next(b for b in batters if b.name == "Virat Kohli")
    assert kohli.runs == 7
    assert kohli.sixes == 1
    assert not kohli.is_out

    rohit = next(b for b in batters if b.name == "Rohit Sharma")
    assert rohit.runs == 4
    assert rohit.fours == 1
    assert rohit.is_out

def test_extract_partnership(sample_events):
    partnership = extract_active_partnership(sample_events)
    assert partnership is not None
    assert partnership.runs == 12
    assert partnership.balls == 4
    assert set([partnership.batter1, partnership.batter2]) == set(["KL Rahul", "Virat Kohli"])

def test_extract_facts(sample_events, sample_match_meta):
    facts = extract_facts(sample_events, sample_match_meta)
    assert facts.score == 16
    assert facts.wickets == 1
    assert facts.overs == "1.0"
    assert facts.run_rate == 16.0
    assert facts.required_run_rate is not None
    assert facts.target == 160
    assert facts.batting_team == "India"
    assert facts.bowling_team == "Pakistan"
