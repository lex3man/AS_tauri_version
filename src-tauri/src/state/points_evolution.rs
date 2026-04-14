use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PointNode {
    pub point_id: String,
    pub prev: Option<String>,
    pub next: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PointLinkedList {
    nodes: HashMap<String, PointNode>,
    pub head: Option<String>,
    pub tail: Option<String>,
    pub active: Option<String>,
    pub length: usize,
}

impl PointLinkedList {
    pub fn new() -> Self {
        PointLinkedList {
            nodes: HashMap::new(),
            head: None,
            tail: None,
            active: None,
            length: 0,
        }
    }

    pub fn from_point_ids(point_ids: Vec<String>) -> Self {
        let mut list = PointLinkedList::new();

        for point_id in point_ids {
            list.append(point_id);
        }

        list
    }

    pub fn append(&mut self, point_id: String) {
        let new_node = PointNode {
            point_id: point_id.clone(),
            prev: self.tail.clone(),
            next: None,
        };

        if let Some(ref old_tail) = self.tail {
            if let Some(tail_node) = self.nodes.get_mut(old_tail) {
                tail_node.next = Some(point_id.clone());
            }
        } else {
            self.head = Some(point_id.clone());
        }

        self.tail = Some(point_id.clone());
        self.nodes.insert(point_id, new_node);
        self.length += 1;
    }

    pub fn _prepend(&mut self, point_id: String) {
        let new_node = PointNode {
            point_id: point_id.clone(),
            prev: None,
            next: self.head.clone(),
        };

        if let Some(ref old_head) = self.head {
            if let Some(head_node) = self.nodes.get_mut(old_head) {
                head_node.prev = Some(point_id.clone());
            }
        } else {
            self.tail = Some(point_id.clone());
        }

        self.head = Some(point_id.clone());
        self.nodes.insert(point_id, new_node);
        self.length += 1;
    }

    pub fn move_next(&mut self) -> Option<String> {
        if let Some(ref active_id) = self.active {
            if let Some(node) = self.nodes.get(active_id) {
                if let Some(ref next_id) = node.next {
                    self.active = Some(next_id.clone());
                    return Some(next_id.clone());
                }
            }
        }
        None
    }

    pub fn move_prev(&mut self) -> Option<String> {
        if let Some(ref active_id) = self.active {
            if let Some(node) = self.nodes.get(active_id) {
                if let Some(ref prev_id) = node.prev {
                    self.active = Some(prev_id.clone());
                    return Some(prev_id.clone());
                }
            }
        }
        None
    }

    pub fn set_active(&mut self, point_id: &str) -> Option<()> {
        if self.nodes.contains_key(point_id) {
            self.active = Some(point_id.to_string());
            Some(())
        } else {
            None
        }
    }

    pub fn get_active(&self) -> Option<&String> {
        self.active.as_ref()
    }

    pub fn peek_next(&self) -> Option<&String> {
        if let Some(ref active_id) = self.active {
            if let Some(node) = self.nodes.get(active_id) {
                return node.next.as_ref();
            }
        }
        None
    }

    pub fn peek_prev(&self) -> Option<&String> {
        if let Some(ref active_id) = self.active {
            if let Some(node) = self.nodes.get(active_id) {
                return node.prev.as_ref();
            }
        }
        None
    }

    pub fn _get_first(&self) -> Option<&String> {
        self.head.as_ref()
    }

    pub fn _get_last(&self) -> Option<&String> {
        self.tail.as_ref()
    }

    pub fn move_to_first(&mut self) -> Option<String> {
        if let Some(ref head_id) = self.head {
            self.active = Some(head_id.clone());
            Some(head_id.clone())
        } else {
            None
        }
    }

    pub fn _move_to_last(&mut self) -> Option<String> {
        if let Some(ref tail_id) = self.tail {
            self.active = Some(tail_id.clone());
            Some(tail_id.clone())
        } else {
            None
        }
    }

    pub fn has_next(&self) -> bool {
        self.peek_next().is_some()
    }

    pub fn has_prev(&self) -> bool {
        self.peek_prev().is_some()
    }

    pub fn _is_empty(&self) -> bool {
        self.length == 0
    }

    pub fn _len(&self) -> usize {
        self.length
    }

    pub fn _to_vec(&self) -> Vec<String> {
        let mut result = Vec::new();
        let mut current = self.head.clone();

        while let Some(point_id) = current {
            result.push(point_id.clone());
            if let Some(node) = self.nodes.get(&point_id) {
                current = node.next.clone();
            } else {
                break;
            }
        }

        result
    }

    pub fn _get_active_index(&self) -> Option<usize> {
        if let Some(ref active_id) = self.active {
            let mut current = self.head.clone();
            let mut index = 0;

            while let Some(point_id) = current {
                if &point_id == active_id {
                    return Some(index);
                }
                index += 1;
                if let Some(node) = self.nodes.get(&point_id) {
                    current = node.next.clone();
                } else {
                    break;
                }
            }
        }
        None
    }

    pub fn _remove(&mut self, point_id: &str) -> Option<()> {
        if let Some(node) = self.nodes.remove(point_id) {
            if let Some(ref prev_id) = node.prev {
                if let Some(prev_node) = self.nodes.get_mut(prev_id) {
                    prev_node.next = node.next.clone();
                }
            } else {
                self.head = node.next.clone();
            }

            if let Some(ref next_id) = node.next {
                if let Some(next_node) = self.nodes.get_mut(next_id) {
                    next_node.prev = node.prev.clone();
                }
            } else {
                self.tail = node.prev.clone();
            }

            if self.active.as_deref() == Some(point_id) {
                self.active = node.next.or(node.prev);
            }

            self.length -= 1;
            Some(())
        } else {
            None
        }
    }

    pub fn _clear(&mut self) {
        self.nodes.clear();
        self.head = None;
        self.tail = None;
        self.active = None;
        self.length = 0;
    }
}

impl Default for PointLinkedList {
    fn default() -> Self {
        Self::new()
    }
}
