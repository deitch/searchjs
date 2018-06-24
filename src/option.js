function _getSingleOpt(first,override,fallback) {
	let ret;
	if (first !== undefined) {
		ret = first;
	} else if (override !== undefined) {
		ret = override;
	} else {
		ret = fallback;
	}
	return ret;
}

export function _getOptions(search, _defaults) {
	const options = {};

	search = search || {};

	// did we have a negator?
	//options.negator = search._not ? true : _defaults.negator || false;
	options.negator = _getSingleOpt(search._not,_defaults.negator,false);
	// do we join via AND or OR
	//options.joinAnd = search._join && search._join === "OR" ? false : _defaults.join || true;
	options.joinAnd = _getSingleOpt(search._join, _defaults.join, "AND") !== "OR";

	// did we have text, word, start or end search?
	options.text = _getSingleOpt(search._text,_defaults.text,false);
	options.word = _getSingleOpt(search._word,_defaults.word,false);
	options.start = _getSingleOpt(search._start,_defaults.start,false);
	options.end = _getSingleOpt(search._end,_defaults.end,false);

	options.separator = search._separator || _defaults.separator || '.';
	options.propertySearch = _getSingleOpt(search._propertySearch,_defaults.propertySearch,false);
	options.propertySearchDepth = _getSingleOpt(search._propertySearchDepth,_defaults.propertySearchDepth,-1);


	return options;
}
