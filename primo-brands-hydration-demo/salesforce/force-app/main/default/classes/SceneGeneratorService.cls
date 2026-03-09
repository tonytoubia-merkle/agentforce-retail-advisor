/**
 * SceneGeneratorService - Generates uiDirective JSON payloads for the frontend.
 * Used by Agentforce topics to construct the visual scene directives
 * that the web app interprets to update the UI.
 */
public with sharing class SceneGeneratorService {

    public class SceneRequest {
        @InvocableVariable(required=true)
        public String action; // SHOW_PRODUCT, SHOW_PRODUCTS, INITIATE_CHECKOUT, CHANGE_SCENE, RESET_SCENE

        @InvocableVariable(required=false)
        public List<String> productIds;

        @InvocableVariable(required=false)
        public String sceneSetting; // neutral, bathroom, travel, outdoor, lifestyle, bedroom, vanity, gym, office

        @InvocableVariable(required=false)
        public Boolean generateBackground;
    }

    public class SceneResponse {
        @InvocableVariable
        public String uiDirectiveJson;
    }

    @InvocableMethod(label='Generate Scene Directive' description='Builds a uiDirective JSON for the frontend')
    public static List<SceneResponse> generateDirective(List<SceneRequest> requests) {
        List<SceneResponse> responses = new List<SceneResponse>();

        for (SceneRequest request : requests) {
            SceneResponse response = new SceneResponse();
            response.uiDirectiveJson = buildDirectiveJson(request);
            responses.add(response);
        }

        return responses;
    }

    private static String buildDirectiveJson(SceneRequest request) {
        Map<String, Object> directive = new Map<String, Object>();
        directive.put('action', request.action);

        Map<String, Object> payload = new Map<String, Object>();

        if (request.productIds != null && !request.productIds.isEmpty()) {
            // Query products and build product array
            List<Product2> products = [
                SELECT Id, Name, Brand__c, Category__c, Price__c, Description__c,
                       Image_URL__c, Skin_Types__c, Rating__c, Is_Travel__c
                FROM Product2
                WHERE Id IN :request.productIds AND IsActive = true
            ];

            List<Map<String, Object>> productList = new List<Map<String, Object>>();
            for (Product2 p : products) {
                Map<String, Object> prod = new Map<String, Object>();
                prod.put('id', p.Id);
                prod.put('name', p.Name);
                prod.put('brand', (String) p.get('Brand__c'));
                prod.put('category', (String) p.get('Category__c'));
                prod.put('price', (Decimal) p.get('Price__c'));
                prod.put('description', (String) p.get('Description__c'));
                prod.put('imageUrl', (String) p.get('Image_URL__c'));
                productList.add(prod);
            }
            payload.put('products', productList);
        }

        if (String.isNotBlank(request.sceneSetting)) {
            Map<String, Object> sceneContext = new Map<String, Object>();
            sceneContext.put('setting', request.sceneSetting);
            sceneContext.put('generateBackground', request.generateBackground != null ? request.generateBackground : false);
            payload.put('sceneContext', sceneContext);
        }

        directive.put('payload', payload);

        Map<String, Object> wrapper = new Map<String, Object>();
        wrapper.put('uiDirective', directive);

        return JSON.serialize(wrapper);
    }
}
