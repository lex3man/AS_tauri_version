use crate::state::points_evolution::PointLinkedList;

#[test]
fn test_basic_navigation() {
    let mut list = PointLinkedList::new();

    list.append("point-1".to_string());
    list.append("point-2".to_string());
    list.append("point-3".to_string());

    assert_eq!(list.len(), 3);
    assert_eq!(list.get_first().unwrap(), "point-1");
    assert_eq!(list.get_last().unwrap(), "point-3");

    list.move_to_first();
    assert_eq!(list.get_active().unwrap(), "point-1");

    list.move_next();
    assert_eq!(list.get_active().unwrap(), "point-2");

    list.move_next();
    assert_eq!(list.get_active().unwrap(), "point-3");

    assert!(!list.has_next());
    assert!(list.has_prev());

    list.move_prev();
    assert_eq!(list.get_active().unwrap(), "point-2");
}

#[test]
fn test_from_point_ids() {
    let ids = vec!["A".to_string(), "B".to_string(), "C".to_string()];

    let list = PointLinkedList::from_point_ids(ids);

    assert_eq!(list.len(), 3);
    assert_eq!(list.to_vec(), vec!["A", "B", "C"]);
}

#[test]
fn test_set_active() {
    let mut list = PointLinkedList::new();

    list.append("point-1".to_string());
    list.append("point-2".to_string());
    list.append("point-3".to_string());

    list.set_active("point-2");
    assert_eq!(list.get_active().unwrap(), "point-2");
    assert_eq!(list.peek_next().unwrap(), "point-3");
    assert_eq!(list.peek_prev().unwrap(), "point-1");

    assert!(list.set_active("non-existent").is_none());
}

#[test]
fn test_remove() {
    let mut list = PointLinkedList::new();

    list.append("point-1".to_string());
    list.append("point-2".to_string());
    list.append("point-3".to_string());

    list.set_active("point-2");
    list.remove("point-2");

    assert_eq!(list.len(), 2);
    assert_eq!(list.get_active().unwrap(), "point-3");
    assert_eq!(list.to_vec(), vec!["point-1", "point-3"]);
}

#[test]
fn test_boundaries() {
    let mut list = PointLinkedList::new();

    list.append("A".to_string());
    list.append("B".to_string());

    list.move_to_first();
    assert!(list.move_prev().is_none());

    list.move_to_last();
    assert!(list.move_next().is_none());
}

#[test]
fn test_get_active_index() {
    let mut list = PointLinkedList::new();

    list.append("A".to_string());
    list.append("B".to_string());
    list.append("C".to_string());

    list.set_active("B");
    assert_eq!(list.get_active_index(), Some(1));

    list.move_to_first();
    assert_eq!(list.get_active_index(), Some(0));

    list.move_to_last();
    assert_eq!(list.get_active_index(), Some(2));
}
