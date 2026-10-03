//! Speed-limit zones between a DZ (zone start) and the FZ that closes it.
//!
//! Which limit is enforced depends not just on where the device is, but on
//! how it got there: taking DZ switches enforcement to the FZ limit, merely
//! driving through DZ's visibility zone without taking it does not. The
//! zones below are numbered as in the spec:
//!
//! 1. inside DZ visibility, DZ not taken yet         -> DZ limit
//! 2. inside DZ capture radius                       -> DZ limit, sign previews FZ
//! 3. left DZ capture, still in DZ visibility        -> FZ limit if DZ taken, else DZ limit
//! 4. between the two visibility zones               -> FZ limit if DZ taken, else DZ limit
//! 5. inside FZ visibility, FZ not taken yet         -> FZ limit (DZ limit if DZ was never taken)
//! 6. inside FZ capture radius                       -> limit of the point after FZ
//! 7. left FZ capture, still in FZ visibility        -> limit of the point after FZ
//!
//! Sign colour follows the zone, not the speedometer: red means violations
//! are being recorded against the number shown, grey means the number is a
//! warning (the upcoming limit, or the "almost at the limit" threshold).

use crate::race::types::{Point, SpecArea};

/// Speed limit of 0 means "no limit configured", in which case nothing is
/// enforced — the existing behaviour for points without a limit.
pub struct SpeedZone {
    /// Limit violations are recorded against.
    pub enforced_limit: u8,
    /// Number shown on the sign — differs from `enforced_limit` inside the
    /// DZ capture radius, where the sign previews the upcoming FZ limit.
    pub sign_limit: u8,
    /// Red sign: the displayed number is actively enforced here.
    pub sign_penalized: bool,
}

/// Where the device sits relative to one point's two radii.
#[derive(PartialEq)]
enum Proximity {
    Capture,
    Visible,
    Outside,
}

fn proximity(point: &Point, distance_m: f64) -> Proximity {
    if distance_m <= point.capture_radius as f64 {
        Proximity::Capture
    } else if distance_m <= point.visible_radius as f64 {
        Proximity::Visible
    } else {
        Proximity::Outside
    }
}

/// Resolves the active zone. `distance_m` yields the current distance to a
/// point in metres; `taken`/`seen` report that point's recorded history.
///
/// Returns `None` when the position has no DZ→FZ context at all, leaving the
/// caller on its default behaviour (the limit of the point being navigated
/// to).
pub fn resolve(
    area: &SpecArea,
    distance_m: &dyn Fn(&Point) -> f64,
    taken: &dyn Fn(&Point) -> bool,
    seen: &dyn Fn(&Point) -> bool,
) -> Option<SpeedZone> {
    // The relevant DZ is the last one along the route the device has already
    // interacted with — or is interacting with right now.
    let dz_idx = area.points_set.iter().rposition(|p| {
        p.point_type == "DZ"
            && (taken(p) || seen(p) || proximity(p, distance_m(p)) != Proximity::Outside)
    })?;
    let dz = &area.points_set[dz_idx];

    // Its closing FZ is the next FZ along the route.
    let fz_idx = area.points_set[dz_idx + 1..]
        .iter()
        .position(|p| p.point_type == "FZ")
        .map(|offset| dz_idx + 1 + offset)?;
    let fz = &area.points_set[fz_idx];

    // Limit that applies once FZ is behind us: the next point's, whatever
    // its type. Without one, FZ's own limit stays in force.
    let after_fz = area
        .points_set
        .get(fz_idx + 1)
        .map(|p| p.speed_limit)
        .unwrap_or(fz.speed_limit);

    let dz_prox = proximity(dz, distance_m(dz));
    let fz_prox = proximity(fz, distance_m(fz));
    let dz_taken = taken(dz);
    let fz_taken = taken(fz);

    // Zones 6 and 7 — FZ reached, so the zone is over and the next point's
    // limit applies. Checked first: inside the FZ radii nothing earlier can
    // still be in force.
    if fz_prox == Proximity::Capture || (fz_taken && fz_prox == Proximity::Visible) {
        return Some(SpeedZone {
            enforced_limit: after_fz,
            sign_limit: after_fz,
            sign_penalized: true,
        });
    }

    // Zone 5 — FZ in sight. The FZ limit only takes over for someone who
    // actually took DZ; otherwise enforcement stayed on DZ all along (the
    // spec's zone 4 note: variant C keeps the DZ limit through zones 4 and 5).
    if fz_prox == Proximity::Visible {
        let limit = if dz_taken { fz.speed_limit } else { dz.speed_limit };
        return Some(SpeedZone {
            enforced_limit: limit,
            sign_limit: limit,
            sign_penalized: true,
        });
    }

    // Zone 2 — inside the DZ capture radius. Still enforced on the DZ limit,
    // while the sign greys out the FZ limit as a heads-up for what's next.
    if dz_prox == Proximity::Capture {
        return Some(SpeedZone {
            enforced_limit: dz.speed_limit,
            sign_limit: fz.speed_limit,
            sign_penalized: false,
        });
    }

    // Zones 3 and 4 — past the DZ capture radius. Taking DZ is what moves
    // enforcement onto the FZ limit; driving past without taking it does not.
    if dz_taken {
        return Some(SpeedZone {
            enforced_limit: fz.speed_limit,
            sign_limit: fz.speed_limit,
            sign_penalized: true,
        });
    }

    // Zone 1 (DZ in sight, not reached) and the untaken-DZ cases of zones 3
    // and 4 all stay on the DZ limit.
    Some(SpeedZone {
        enforced_limit: dz.speed_limit,
        sign_limit: dz.speed_limit,
        sign_penalized: true,
    })
}
