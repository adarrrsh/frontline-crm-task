/** Pending likes whose employer response is due. */
export function dueInterests(liked, now) {
  return Object.values(liked).filter((l) => l.status === 'pending' && l.resolveAt <= now);
}

/** Earliest future resolveAt among pending likes, or null. */
export function nextResolveAt(liked) {
  let next = null;
  for (const l of Object.values(liked)) {
    if (l.status === 'pending' && (next === null || l.resolveAt < next)) next = l.resolveAt;
  }
  return next;
}
