use crate::state::AppState;

fn with_records(count: usize) -> AppState {
    let mut state = AppState::default();
    state.collected = (0..count).map(|i| format!("record-{}", i)).collect();
    state
}

#[test]
fn ack_trims_from_the_front_and_moves_the_base() {
    let mut state = with_records(5);

    assert_eq!(state.ack_collected(2), 3);
    assert_eq!(state.collected, vec!["record-3", "record-4"]);
    assert_eq!(state.collected_base, 3);
}

#[test]
fn a_stale_ack_is_ignored() {
    let mut state = with_records(5);
    state.ack_collected(4);

    // Records gathered after the batch that is only now acking.
    state.collected = vec!["fresh-0".to_string(), "fresh-1".to_string()];

    // An upload that started earlier and finished late: everything it names
    // has already gone, so it must not touch what arrived since.
    assert_eq!(state.ack_collected(1), 0);
    assert_eq!(state.collected, vec!["fresh-0", "fresh-1"]);
    assert_eq!(state.collected_base, 5);
}

#[test]
fn overlapping_batches_ack_in_either_order() {
    // Batch A covers 0..=2, batch B covers 0..=4 — B acking first must not
    // let A's later ack bite into anything beyond its own range.
    let mut state = with_records(6);

    assert_eq!(state.ack_collected(4), 5);
    assert_eq!(state.ack_collected(2), 0);
    assert_eq!(state.collected, vec!["record-5"]);
    assert_eq!(state.collected_base, 5);
}

#[test]
fn an_ack_past_the_end_drains_no_further_than_the_buffer() {
    let mut state = with_records(3);

    assert_eq!(state.ack_collected(99), 3);
    assert!(state.collected.is_empty());
    assert_eq!(state.collected_base, 3);
}

#[test]
fn dropping_the_buffer_keeps_sequence_numbers_moving() {
    let mut state = with_records(4);
    state.drop_collected();

    assert!(state.collected.is_empty());
    assert_eq!(state.collected_base, 4);

    // A new day code starts gathering; the abandoned batch's ack arrives.
    state.collected = vec!["new-0".to_string()];
    assert_eq!(state.ack_collected(3), 0);
    assert_eq!(state.collected, vec!["new-0"]);
}
