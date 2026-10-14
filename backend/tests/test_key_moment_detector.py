import pytest
from app.models import BallEvent, FactsObject
from app.key_moment_detector import detect_key_moments

@pytest.fixture
def sample_facts():
    return FactsObject(
        score=80,
        wickets=3,
        overs="12.0",
        run_rate=6.67,
        required_run_rate=10.0,
        top_batters=[],
        top_bowlers=[],
        last_3_overs=[],
        active_partnership=None,
        first_innings_summary=None,
        target=160,
        current_batters=["Virat Kohli", "Hardik Pandya"],
        current_bowler="Haris Rauf",
        batting_team="India",
        bowling_team="Pakistan"
    )

@pytest.fixture
def sample_moment_events():
    events = []
    for ball in range(1, 7):
        runs = 4 if ball in [1, 2, 3, 4] else 0
        events.append(
            BallEvent(
                index=ball - 1,
                innings=2,
                over=11,
                ball=ball,
                batter="Virat Kohli",
                bowler="Mohammad Nawaz",
                non_striker="Hardik Pandya",
                runs_batter=runs,
                runs_extras=0,
                runs_total=runs,
                is_wicket=False,
                running_score=60 + runs * ball,
                running_wickets=3,
                target=160
            )
        )
    events.append(
        BallEvent(
            index=6,
            innings=2,
            over=18,
            ball=5,
            batter="Virat Kohli",
            bowler="Haris Rauf",
            non_striker="Hardik Pandya",
            runs_batter=6,
            runs_extras=0,
            runs_total=6,
            is_wicket=False,
            running_score=135,
            running_wickets=3,
            target=160
        )
    )
    events.append(
        BallEvent(
            index=7,
            innings=2,
            over=19,
            ball=1,
            batter="Hardik Pandya",
            bowler="Mohammad Nawaz",
            non_striker="Virat Kohli",
            runs_batter=0,
            runs_extras=0,
            runs_total=0,
            is_wicket=True,
            wicket_kind="caught",
            player_out="Hardik Pandya",
            running_score=144,
            running_wickets=4,
            target=160
        )
    )
    return events

def test_detect_key_moments_count_and_order(sample_moment_events, sample_facts):
    moments = detect_key_moments(sample_moment_events, sample_facts)
    assert len(moments) <= 4
    assert len(moments) >= 2
    for m in moments:
        assert m.weight > 0
        assert m.description != ""
        assert m.reason != ""
