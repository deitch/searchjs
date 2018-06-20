//https://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/
export function toType(obj) {
	return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
}

// returns the item in the object that matches a key
// but is smart enough to handle dot-notation
// so "a.b" returns obj["a.b"] or obj["a"]["b"] if it exists
export function deepField(data,propertyPath,propertySearch,propertySearchDepth) {
	let ret = null, i, copyPropertyPath, itemValue, parameter, newPropertySearchDepth = -1;
	// Check if the max-search depth got reached when propertySearch is activated
	if (propertySearch) {
		if (propertySearchDepth === 0) {
			// Max depth reached
			return null;
		} else if (propertySearchDepth !== -1) {
			newPropertySearchDepth = propertySearchDepth -1;
		}
	}

	if (data === null || data === undefined || propertyPath === null || propertyPath === undefined || !Array.isArray(propertyPath) || propertyPath.length < 1) {
		ret = null;
	} else if (Array.isArray(data)) {
		// If it is an Array we have to check all the items for the value
		// Go through each of the items and return all the values that have it
		ret = [];
		for (i=0;i<data.length;i++) {
			// We copy the value because it is just a reference the first round would delete it and the second one would
			// not know anymore what to look for
			copyPropertyPath = propertyPath.slice(0);

			// First try to find the value
			itemValue = deepField(data[i], copyPropertyPath, propertySearch, newPropertySearchDepth-1);

			// We return all the values that match
			if (itemValue) {
				ret.push(itemValue);
			}
		}
		if (ret.length === 0) {
			ret = null;
		}
	} else if (typeof data === 'object') {
		// It is an object so we can proceed normally

		// Get the parameter
		parameter = propertyPath[0];

		// If propertySearch is activated we go on to look on lower levels
		if (!data.hasOwnProperty(parameter) && propertySearch) {
			const propertyNames = Object.keys(data);
			ret = [];

			for (i=0;i<propertyNames.length;i++) {
				const propertyData = data[propertyNames[i]];

				if (propertyData === null || propertyData === undefined) {
					continue;
				}

				// If the property contains an array or an object we have to dig deeper
				if (Array.isArray(propertyData)) {

					// Is an array so we have to check every item
					propertyData.forEach(function(propertyDataItem) {
						const foundValue = deepField(propertyDataItem, propertyPath, propertySearch, newPropertySearchDepth);
						if (foundValue !== null) {
							ret.push(foundValue);
						}
					});

				} else if (propertyData.constructor.name === 'Object') {
					// Is a single object so we can check it directly
					const foundValue = deepField(propertyData, propertyPath, propertySearch, newPropertySearchDepth);
					if (foundValue !== null) {
						ret.push(foundValue);
					}
				}
			}

			if (ret.length === 0) {
				ret = null;
			} else if (ret.length === 1) {
				ret = ret[0];
			}

		} else if (propertyPath.length < 2) {
			// If the current one was the last parameter part left we can directly return
			ret = data[parameter];
		} else {
			// If there are more parts left we go on with the search

			// We get rid of the first parameter
			ret = deepField(data[parameter], propertyPath.slice(1), propertySearch, newPropertySearchDepth);
		}
	}


	return ret;
}
