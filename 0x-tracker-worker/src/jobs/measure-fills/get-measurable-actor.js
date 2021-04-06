const { FILL_ACTOR } = require('../../constants');

const checkIsSideMeasurable = (fill, actor) => {
  const assets = fill.assets.filter(asset => asset.actor === actor);

  return assets.length !== 0;
};

const getMeasurableActor = fill => {
  if (!Array.isArray(fill.assets) || fill.assets.length === 0) {
    return null;
  }

  const measurableActor = [FILL_ACTOR.MAKER, FILL_ACTOR.TAKER].find(actor => {
    return checkIsSideMeasurable(fill, actor);
  });

  return measurableActor === undefined ? null : measurableActor;
};

module.exports = getMeasurableActor;
