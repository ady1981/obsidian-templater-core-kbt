const config = {
    placeholder: '{{}}',
    differenceSeparator: ' VS ',
    aiFunctionsBaseURL: 'http://127.0.0.1:5000',
    aiFunctionsAPIToken: 'xxx',
    responseLanguage: 'Russian'
}

function strJson(obj) {
    return JSON.stringify(obj, null, 2)
}    

function strProperties(obj) {
    return Object.entries(obj)
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
}

function isNotEmpty(strOrList) {
    return strOrList && strOrList.length > 0;
}

function removeLineWithPlaceholder(text) {
    if (!text) {
        return text;
    }
    const lines = text.split('\n');
    const filteredLines = lines.filter(line => !line.includes(config.placeholder));
    return filteredLines.join('\n');
}

function withLanguageOutputSpecification(extra_output_specification) {
    const lang_output_specification = strProperties({'Output_language': config.responseLanguage})
    const extra_output_specification2 = extra_output_specification ?
      lang_output_specification + '\n' + extra_output_specification :
      lang_output_specification;
    return extra_output_specification2
}

async function abstractive_summarize(tp, content, content_topic, summarizing_strategy, examples) {
    const request = {
        url: `${config.aiFunctionsBaseURL}/ai-func/abstractive_summarize`,
        method: 'PUT',
        headers: {'Api-Token': config.aiFunctionsAPIToken, 'Content-Type': 'application/json'},
        body: JSON.stringify({
            language: config.responseLanguage, 
            content, 
            content_topic,
            summarizing_strategy,
            _examples: maybeWithHeader(examples, 'Examples')
        })
    };
    return await tp.obsidian.requestUrl(request);
}

function maybeWithHeader(value, header) {
    return value ?
       `# ${header}\n${value}\n` :
       ''
}

async function objective_expert_review(tp, content, content_topic, review_strategy, examples) {
    const request = {
        url: `${config.aiFunctionsBaseURL}/ai-func/objective_expert_review`,
        method: 'PUT',
        headers: {'Api-Token': config.aiFunctionsAPIToken, 'Content-Type': 'application/json'},
        body: JSON.stringify({
            language: config.responseLanguage, 
            content, 
            content_topic, 
            review_strategy, 
            _examples: maybeWithHeader(examples, 'Examples')
        })
    }
    return await tp.obsidian.requestUrl(request);
}

async function generate_example(tp, target_example_description, target_example_topic, extra_output_specification, generation_strategy, examples) {
    const extra_output_specification2 = withLanguageOutputSpecification(extra_output_specification);
    const request = {
        url: `${config.aiFunctionsBaseURL}/ai-func/generate_example`,
        method: 'PUT',
        headers: {'Api-Token': config.aiFunctionsAPIToken, 'Content-Type': 'application/json'},
        body: JSON.stringify({
            target_example_description,
            target_example_topic,
            _extra_output_specification: maybeWithHeader(extra_output_specification2, 'Extra output specification'),
            _generation_strategy: maybeWithHeader(generation_strategy, 'Generation strategy'),
            _examples: maybeWithHeader(examples, 'Examples')
        })
    }
    // console.log('request:', strJson(request));
    return await tp.obsidian.requestUrl(request);
}

async function information_retrieval(tp, target_item_description, target_item_topic, extra_output_specification, retrieval_strategy, examples) {
    const extra_output_specification2 = withLanguageOutputSpecification(extra_output_specification);
    const request = {
        url: `${config.aiFunctionsBaseURL}/ai-func/information_retrieval`,
        method: 'PUT',
        headers: {'Api-Token': config.aiFunctionsAPIToken, 'Content-Type': 'application/json'},
        body: JSON.stringify({
            target_item_description,
            target_item_topic,
            _extra_output_specification: maybeWithHeader(extra_output_specification2, 'Extra output specification'),
            _retrieval_strategy: maybeWithHeader(retrieval_strategy, 'Retrieval strategy'),
            _examples: maybeWithHeader(examples, 'Examples')
        })
    }
    // console.log('request:', strJson(request));
    return await tp.obsidian.requestUrl(request);
}

const isString = (value) => typeof value === "string";

const normalizeStr = (str) => isString(str) ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : str;

const sanitizeName = (name) => isString(name) ? normalizeStr(name).trim().replace(/\s+/g, '-') : name; 

function getOrDefault(obj, key, defaultValue) {
  return obj[key] ?? defaultValue;
}

function strPrimaryProperty(keyPath, value) {
    const keyStr = keyPath.filter(c => c).map(sanitizeName).join('.');
    return `**${keyStr}**:: ${normalizeStr(value)}`
}
function strSecondaryProperty(keyPath, value) {
    const keyStr = keyPath.filter(c => c).map(sanitizeName).join('.');
    return `${keyStr}:: ${normalizeStr(value)}`
}

function formatAspectAnalysisResult(result) { 
    const properties = result.by_aspects.flatMap(aspect =>
    aspect.features.reduce(({occurs, result}, feature) => {
        occurs[feature.feature_name] = getOrDefault(occurs, feature.feature_name, 0) + 1;
        const idxItem = occurs[feature.feature_name] >= 2 ? occurs[feature.feature_name] : null;
        const updResult = [...result,
            aspect?.is_primary_aspect ?
            strPrimaryProperty([aspect.main_elementary_aspect_name, feature.feature_name, idxItem], feature.feature_elementary_value_term) :
            strSecondaryProperty([aspect.main_elementary_aspect_name, feature.feature_name, idxItem], feature.feature_elementary_value_term)];
        return {occurs, result: updResult}
        }, {occurs: {}, result: []})
      .result
    )
    return properties.join('\n');
}


async function aspect_based_analysis(tp, content, content_topic, extra_output_specification, analysis_scope, analysis_strategy, examples) {
    const extra_output_specification2 = withLanguageOutputSpecification(extra_output_specification);
    const request = {
        url: `${config.aiFunctionsBaseURL}/ai-func/aspect_based_analysis`,
        method: 'PUT',
        headers: {'Api-Token': config.aiFunctionsAPIToken, 'Content-Type': 'application/json'},
        body: JSON.stringify({
            content, 
            content_topic,
            _extra_output_specification: extra_output_specification2,
            _analysis_scope: maybeWithHeader(analysis_scope, 'Analysis scope'),
            _analysis_strategy: maybeWithHeader(analysis_strategy, 'Analysis strategy'),
            _examples: maybeWithHeader(examples, 'Examples')
        })
    }
    // console.log('request:', strJson(request));
    return await tp.obsidian.requestUrl(request);
}

async function constrained_text_rewriting(tp, content, content_topic, extra_output_specification, transformation_constraints, examples) {
    const extra_output_specification2 = withLanguageOutputSpecification(extra_output_specification);
    const request = {
        url: `${config.aiFunctionsBaseURL}/ai-func/constrained_text_rewriting`,
        method: 'PUT',
        headers: {'Api-Token': config.aiFunctionsAPIToken, 'Content-Type': 'application/json'},
        body: JSON.stringify({
            content, 
            content_topic,
            _extra_output_specification: extra_output_specification2,
            _transformation_constraints: maybeWithHeader(transformation_constraints, 'Transformation constraints'),
            _examples: maybeWithHeader(examples, 'Examples')
        })
    }
    // console.log('request:', strJson(request));
    return await tp.obsidian.requestUrl(request);
}

function formatDifferenceResult(result, items) {
  const leftLines = result.by_aspects.flatMap(aspect =>
    aspect.features.map(feature =>
        aspect?.is_primary_aspect ?
          strPrimaryProperty([aspect.main_elementary_aspect_name, feature.feature_name], feature.left_item_elementary_value_term) :
          strSecondaryProperty([aspect.main_elementary_aspect_name, feature.feature_name], feature.left_item_elementary_value_term)
    )
  );
  const rightLines = result.by_aspects.flatMap(aspect =>
    aspect.features.map(feature =>
        aspect?.is_primary_aspect ?
          strPrimaryProperty([aspect.main_elementary_aspect_name, feature.feature_name], feature.right_item_elementary_value_term) :
          strSecondaryProperty([aspect.main_elementary_aspect_name, feature.feature_name], feature.right_item_elementary_value_term)
    )
  );
  return `# Difference
## ${items[0]}

${leftLines.join('\n')}

## ${items[1]}

${rightLines.join('\n')}
`;
}

async function aspect_based_devergence_analysis(tp, items_topic, left_item, right_item, extra_output_specification, analysis_strategy, examples) {
    const extra_output_specification2 = withLanguageOutputSpecification(extra_output_specification);
    const request = {
        url: `${config.aiFunctionsBaseURL}/ai-func/aspect_based_devergence_analysis`,
        method: 'PUT',
        headers: {'Api-Token': config.aiFunctionsAPIToken, 'Content-Type': 'application/json'},
        body: JSON.stringify({
            items_topic,
            left_item,
            right_item,
            _extra_output_specification: extra_output_specification2,
            _analysis_strategy: maybeWithHeader(analysis_strategy, 'Analysis strategy'),
            _examples: maybeWithHeader(examples, 'Examples')
        })
    }
    // console.log('request:', strJson(request));
    return await tp.obsidian.requestUrl(request);
}


module.exports = {
    config: () => config,
    strJson,
    strProperties,
    isNotEmpty,
    removeLineWithPlaceholder,
    maybeWithHeader,
    abstractive_summarize,
    objective_expert_review,
    generate_example,
    information_retrieval,
    formatAspectAnalysisResult,
    aspect_based_analysis,
    constrained_text_rewriting,
    formatDifferenceResult,
    aspect_based_devergence_analysis
}
