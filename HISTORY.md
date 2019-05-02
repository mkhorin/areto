## 0.25.0

* base/Base
    - add spawn method to create instance with dependencies
* base/ClassMapper
    - add class dependencies to module configuration
* base/Module
    - add origin to inherit all module functionality
* captcha/CaptchaAction
    - replace gm with sharp
* db/ActiveRecord
    - extend beforeSave with beforeInsert and beforeUpdate
    - extend afterSave with afterInsert and afterUpdate
* upgrade to Node.js 12

## 0.24.0

* base/Action
    - add controller's methods
* base/Controller
    - rename getBodyParam to getPostParam
* behavior/OrderBehavior
    - refactor update method
* db/MongoDriver
    - add unset and unsetAll commands
* db/Query
    - append getter methods
* validator/NumberValidator
    - fix validation method

## 0.23.0

* db/Query
    - extend select and addSelect methods to take array and string arguments
* helper/DateHelper
    - extract date methods to a separate class
* helper/MongoHelper
    - add array identifier checker