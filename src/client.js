const config = {
    aiFunctionsBaseURL: 'http://127.0.0.1:5001',
    aiFunctionsAPIToken: 'xxx',
    responseLanguage: 'Russian',
    emptyValueMark: '-',
    placeholder: '{{}}',
    itemsSeparator: '\n',
    itemsBullet: '- ',
    itemsIndent: '  ',
    disjointnessScoreThreshold: 0.9,
    referencePropName: 'reference',
    contentCodeBlockBackticks: '~~~',
    langPropertyName: 'Output_content_language',
    differenceItemsSeparator: '\n',
}


function strJson(obj) {
    return JSON.stringify(obj, null, 2)
}    

function strProperties(obj) {
    if (! obj) { return '' }
    return Object.entries(obj)
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
}

function isNotEmpty(strOrList) {
    return strOrList && strOrList.length > 0;
}

function isEmpty(strOrList) {
    return !strOrList || strOrList.length == 0;
}

function removeLineWithPlaceholder(text) {
    if (!text) {
        return text;
    }
    const lines = text.split('\n');
    const filteredLines = lines.filter(line => !line.includes(config.placeholder));
    return filteredLines.join('\n');
}

function removeSuffix(str, suffix) {
  if (str.endsWith(suffix)) {    
    return str.slice(0, -suffix.length);
  }
  return str;
}

function withLanguageOutputSpecification(extra_output_specification) {
    if ((extra_output_specification || '').includes(`${config.langPropertyName}:`)) {
        return extra_output_specification
    } else {
        const lang_output_specification = strProperties({[config.langPropertyName]: config.responseLanguage})
        const extra_output_specification2 = isNotEmpty(extra_output_specification) ?
          lang_output_specification + '\n' + extra_output_specification :
          lang_output_specification;
        return extra_output_specification2
    }
}

function encodeInMarkdown(codeText, lang = 'md') {
    return `${config.contentCodeBlockBackticks}${lang}\n${codeText}\n${config.contentCodeBlockBackticks}\n`
}

function maybeWithHeader(value, header, headingLevel = 1) {
    return value ?
       `${'#'.repeat(headingLevel)} ${header}\n${value}` :
       ''
}

const isString = (value) => typeof value === "string";

const normalizeUnicodeText = (text) => isString(text) ? text.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : text;

const sanitizeText = (text) => isString(text) ? normalizeUnicodeText(text).trim().replace(/\s+/g, '-') : text; 

function getOrDefault(obj, key, defaultValue) {
  return obj[key] ?? defaultValue;
}

function strPrimaryProperty(keyPath, value, opts) {
    const keyStr = keyPath.filter(c => c).map(c => opts?.sanitizeText ? sanitizeText(c) : c).join('.');
    return `[**${keyStr}**:: ${opts?.normalizeText ? normalizeUnicodeText(value) : value}]`
}

function strSecondaryProperty(keyPath, value, opts) {
    const keyStr = keyPath.filter(c => c).map(c => opts?.sanitizeText ? sanitizeText(c) : c).join('.');
    return `[${keyStr}:: ${opts?.normalizeText ? normalizeUnicodeText(value) : value}]`
}

function formatAsList(items, ident = '') {
    return formatTextsAsList(items.map(c => c.item), ident)
}

function formatTextsAsList(texts, ident = '') {
    return texts.map(c => `${ident}${config.itemsBullet}${c}`).join('\n')
}

function formatAsText(items, ident = '') {
    return isEmpty(items) ? config.emptyValueMark : items.map(c => `${ident}${c?.item}`).join('\n')
}

function formatFactualQA(result) {
    return result.items.map(({answer_text, answer_references}) => {
      const refsStr = answer_references.map((c, idx) => `${config.itemsIndent}${config.itemsBullet}[${config.referencePropName}.${idx + 1}:: ${c?.reference_text}${c?.reference_type === 'internal_knowledge' ? ' // internal knowledge' : ''}]`)
        .join('\n');
      return `${config.itemsBullet}${answer_text}\n${refsStr}`
      })
      .join('\n')
}

function calcProperties(aspect, opts) {
    return aspect.features.reduce(({occurs, result}, feature) => {
        occurs[feature.feature_name] = getOrDefault(occurs, feature.feature_name, 0) + 1;
        const idxItem = occurs[feature.feature_name] >= 2 ? occurs[feature.feature_name] : null;
        const updResult = [...result,
            aspect?.is_primary_aspect ?
            strPrimaryProperty((aspect.elementary_aspect_name !== feature.feature_name) ? 
                [aspect.elementary_aspect_name, feature.feature_name, idxItem] :
                [aspect.elementary_aspect_name, idxItem]
                , feature.feature_elementary_value, opts) :
            strSecondaryProperty((aspect.elementary_aspect_name !== feature.feature_name) ? 
              [aspect.elementary_aspect_name, feature.feature_name, idxItem] :
              [aspect.elementary_aspect_name, idxItem]
              , feature.feature_elementary_value, opts)];
        return {occurs, result: updResult}
        }, {occurs: {}, result: []})
      .result
}

function formatAspectAnalysisResult(result, opts = {sanitizeText: false, normalizeText: true}) {    
    return formatTextsAsList(result.by_aspects.flatMap(c => calcProperties(c, opts)));
}

function formatAspectRewriteResult(result, opts = {sanitizeText: false, normalizeText: true}) {
    const propertiesStr = formatTextsAsList(result.changed_aspects.flatMap(c => calcProperties(c, opts)));
    return result.rewritten_item + '\n' + propertiesStr;
}

function formatDifferenceResult(result, items, opts = {sanitizeText: false, normalizeText: true}) {
  const leftFeatures = result.by_aspects.flatMap(aspect =>
    aspect.different_features.map(feature =>
        aspect?.is_primary_aspect ?
          strPrimaryProperty([aspect.elementary_aspect_name, feature.feature_name], feature.left_item_feature_elementary_value, opts) :
          strSecondaryProperty([aspect.elementary_aspect_name, feature.feature_name], feature.left_item_feature_elementary_value, opts)
    )
  );
  const rightFeatures = result.by_aspects.flatMap(aspect =>
    aspect.different_features.map(feature =>
        aspect?.is_primary_aspect ?
          strPrimaryProperty([aspect.elementary_aspect_name, feature.feature_name], feature.right_item_feature_elementary_value, opts) :
          strSecondaryProperty([aspect.elementary_aspect_name, feature.feature_name], feature.right_item_feature_elementary_value, opts)
    )
  );
  return `# Difference
## ${items[0]}

${formatTextsAsList(leftFeatures)}

## ${items[1]}

${formatTextsAsList(rightFeatures)}
`;
}

function formatCommonResult(result, _items, opts = {sanitizeText: false, normalizeText: false}) {
  const features = result.by_aspects.flatMap(aspect =>
    aspect.common_aspect_features.map(feature =>
        aspect?.is_primary_aspect ?
          strPrimaryProperty([aspect.elementary_aspect_name, feature.common_feature_name], feature.common_feature_value, opts) :
          strSecondaryProperty([aspect.elementary_aspect_name, feature.common_feature_name], feature.common_feature_value, opts)
    )
  );
  return formatTextsAsList(features);
}

function formatNewItemResult(result, opts = {normalizeText: false}) {
    const {extra_disjoint_items} = result;
    const extra_disjoint_items2 = isEmpty(extra_disjoint_items) ?
      [] :
      extra_disjoint_items.filter(c => 
        c?.is_item_an_instance_of_the_Universe_of_Discourse && (typeof c?.is_item_an_instance_of_the_Universe_of_Discourse === 'boolean') &&
        (typeof c?.item_disjointness_score === 'number') && (c.item_disjointness_score >= config.disjointnessScoreThreshold));
    if (isEmpty(extra_disjoint_items2)) {
        //console.log('empty item generation result');
        return config.emptyValueMark;
    }
    return formatTextsAsList(extra_disjoint_items2
      .map(c => c?.item_value)
      .map(c => opts?.normalizeText ? normalizeUnicodeText(c) : c))      
}

function formatGroupResult(result, _opts) {
    return result.Universe_of_Discourse_name
}

function formatIncontextQAResult(result, _opts) {
    return formatTextsAsList(result.items.map(({answer_text}) => answer_text))      
}

function withContentSection(originMdText, content_header, headingLevel, content, contentLang = 'md') {    
    const contentStr = maybeWithHeader(encodeInMarkdown(content, contentLang), content_header, headingLevel);
    if (isNotEmpty(originMdText)) {
        return originMdText + '\n' + contentStr
    } else {
        return contentStr
    }
}

function withSection(originMdText, text_header, headingLevel, text) {
    const contentStr = maybeWithHeader(text, text_header, headingLevel);
    if (isNotEmpty(originMdText)) {
        return originMdText + '\n' + contentStr
    } else {
        return contentStr
    }
}


async function generate(tp, task_specification, target_semantic_specification, context_knowledge_topic, extra_context_knowledge_specification, extra_information_retrieval_strategy, output_generation_strategy, extra_output_specification, meta) {
    const target_specification = [maybeWithHeader(task_specification, 'Task specification', 2), maybeWithHeader(target_semantic_specification, 'Target semantic specification', 2)]
          .filter(isNotEmpty)
          .join('\n')
          .trim();
    const context_knowledge_specification = [maybeWithHeader(context_knowledge_topic, 'Context knowledge topic', 3), extra_context_knowledge_specification]
          .filter(isNotEmpty)
          .join('\n')
          .trim();
    const extra_output_specification2 = withLanguageOutputSpecification(extra_output_specification) + '\n';
    const request = {
        url: `${config.aiFunctionsBaseURL}/ai-func/generate`,
        method: 'PUT',
        headers: {'Api-Token': config.aiFunctionsAPIToken, 'Content-Type': 'application/json'},
        body: JSON.stringify({
            target_specification,
            context_knowledge_specification,
            _extra_information_retrieval_strategy: maybeWithHeader(extra_information_retrieval_strategy, 'Extra information retrieval strategy', 2),
            _output_generation_strategy: maybeWithHeader(output_generation_strategy, 'Output generation strategy'),
            _extra_output_specification: maybeWithHeader(extra_output_specification2, 'Extra output specification'),
            meta      
        })
    }
    //console.log('request:', strJson(request));
    return await tp.obsidian.requestUrl(request);
}

async function custom_generative_generate(customAIFunction, customData, tp, knowledge_topic, target_semantic_specification, extra_information_retrieval_strategy, output_generation_strategy, extra_output_specification, meta) {
    const extra_output_specification2 = withLanguageOutputSpecification(extra_output_specification);    
    const request = {
        url: `${config.aiFunctionsBaseURL}/ai-func/${customAIFunction}`,
        method: 'PUT',
        headers: {'Api-Token': config.aiFunctionsAPIToken, 'Content-Type': 'application/json'},
        body: JSON.stringify({...customData,        
            _target_semantic_specification: maybeWithHeader(target_semantic_specification, 'Target semantic specification', 2),
            context_knowledge_specification: maybeWithHeader(knowledge_topic, 'Knowledge topic', 3),
            _extra_information_retrieval_strategy: maybeWithHeader(extra_information_retrieval_strategy, 'Extra information retrieval strategy', 2),
            _output_generation_strategy: maybeWithHeader(output_generation_strategy, 'Output generation strategy'),
            _extra_output_specification: maybeWithHeader(extra_output_specification2, 'Extra output specification'),
            meta      
        })
    }
    //console.log('request:', strJson(request));
    return await tp.obsidian.requestUrl(request);
}

async function custom_incontext_generate(customAIFunction, customData, tp, source_knowledge_specification, target_semantic_specification, extra_information_retrieval_strategy, output_generation_strategy, extra_output_specification, meta) {
    const extra_output_specification2 = withLanguageOutputSpecification(extra_output_specification);    
    const request = {
        url: `${config.aiFunctionsBaseURL}/ai-func/${customAIFunction}`,
        method: 'PUT',
        headers: {'Api-Token': config.aiFunctionsAPIToken, 'Content-Type': 'application/json'},
        body: JSON.stringify({...customData,        
            _target_semantic_specification: maybeWithHeader(target_semantic_specification, 'Target semantic specification', 2),
            source_knowledge_specification,
            _extra_information_retrieval_strategy: maybeWithHeader(extra_information_retrieval_strategy, 'Extra information retrieval strategy', 2),
            _output_generation_strategy: maybeWithHeader(output_generation_strategy, 'Output generation strategy'),
            _extra_output_specification: maybeWithHeader(extra_output_specification2, 'Extra output specification'),
            meta      
        })
    }
    //console.log('request:', strJson(request));
    return await tp.obsidian.requestUrl(request);
}


function factual_question_answering(tp, question, knowledge_topic, target_semantic_specification, extra_information_retrieval_strategy, output_generation_strategy, extra_output_specification, meta) {    
  return custom_generative_generate('factual_question_answering', {question}, tp, knowledge_topic, target_semantic_specification, extra_information_retrieval_strategy, output_generation_strategy, extra_output_specification, meta)
}

function aspected_analyze(tp, content, knowledge_topic, target_semantic_specification, extra_information_retrieval_strategy, output_generation_strategy, extra_output_specification, meta) {    
    return custom_generative_generate('aspected_analyze', {content}, tp, knowledge_topic, target_semantic_specification, extra_information_retrieval_strategy, output_generation_strategy, extra_output_specification, meta)
}

function aspected_rewrite(tp, content, knowledge_topic, target_semantic_specification, extra_information_retrieval_strategy, output_generation_strategy, extra_output_specification, meta) {    
    return custom_generative_generate('aspected_rewrite', {content}, tp, knowledge_topic, target_semantic_specification, extra_information_retrieval_strategy, output_generation_strategy, extra_output_specification, meta)
}

function aspected_devergence_analyze(tp, left_item, right_item, knowledge_topic, target_semantic_specification, extra_information_retrieval_strategy, output_generation_strategy, extra_output_specification, meta) {    
    return custom_generative_generate('aspected_devergence_analyze', {left_item, right_item}, tp, knowledge_topic, target_semantic_specification, extra_information_retrieval_strategy, output_generation_strategy, extra_output_specification, meta)
}

function aspected_commonality_analyze(tp, left_item, right_item, knowledge_topic, target_semantic_specification, extra_information_retrieval_strategy, output_generation_strategy, extra_output_specification, meta) {    
    return custom_generative_generate('aspected_commonality_analyze', {left_item, right_item}, tp, knowledge_topic, target_semantic_specification, extra_information_retrieval_strategy, output_generation_strategy, extra_output_specification, meta)
}

function disjoint_sequence_item_generation(tp, sequence, knowledge_topic, target_semantic_specification, extra_information_retrieval_strategy, output_generation_strategy, extra_output_specification, meta) {    
    return custom_generative_generate('disjoint_sequence_item_generation', {sequence}, tp, knowledge_topic, target_semantic_specification, extra_information_retrieval_strategy, output_generation_strategy, extra_output_specification, meta)
}

function group_identification(tp, sequence, knowledge_topic, target_semantic_specification, extra_information_retrieval_strategy, output_generation_strategy, extra_output_specification, meta) {    
    return custom_generative_generate('group_identification', {sequence}, tp, knowledge_topic, target_semantic_specification, extra_information_retrieval_strategy, output_generation_strategy, extra_output_specification, meta)
}

function incontext_question_answering(tp, question, source_knowledge_specification, target_semantic_specification, extra_information_retrieval_strategy, output_generation_strategy, extra_output_specification, meta) {    
    return custom_incontext_generate('incontext_question_answering', {question}, tp, source_knowledge_specification, target_semantic_specification, extra_information_retrieval_strategy, output_generation_strategy, extra_output_specification, meta)
}


module.exports = {
    // utils
    config: () => config,
    strJson,
    strProperties,    
    isNotEmpty,
    isEmpty,
    removeLineWithPlaceholder,
    removeSuffix,
    maybeWithHeader,
    encodeInMarkdown,
    withSection,
    withContentSection,
    // formaters
    formatAsList,
    formatAsText,
    formatFactualQA,
    formatAspectAnalysisResult,
    formatAspectRewriteResult,
    formatDifferenceResult,
    formatCommonResult,
    formatNewItemResult,
    formatGroupResult, 
    formatIncontextQAResult,
    // API helpers
    generate,
    factual_question_answering,
    aspected_analyze,
    aspected_rewrite,
    aspected_devergence_analyze,
    aspected_commonality_analyze,
    disjoint_sequence_item_generation,
    group_identification,
    incontext_question_answering
}
