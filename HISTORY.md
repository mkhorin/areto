## 0.28.0

* db/Database
    - database components refactor
* i18n/FileMessageSource
    - file message source refactor
* log/Logger
    - logger refactor
    - extract ActionProfiler as component
* scheduler/Scheduler
    - append initialize method
* security/Auth
    - authentication components refactor

## 0.27.0

* db/ActiveLinker
    - extract as separate entity
* helper/QueryHelper
    - fix query with multiple nested relations
* i18n/I18n
    - resolve message source with module origin
* scheduler/Scheduler
    - assign task module
* validator/SpawnValidator
    - validate spawn configuration JSON
* view/Theme
    - add isOrigin flag to template hierarchy
    - get closest ancestor template (to call from overwritten one)

## 0.26.0

* base/Configuration
    - show config file exception
* captcha/CaptchaAction
    - fix font configuration
* helper/FileHelper
    - promised file actions
* log/FileLogStore
    - non-blocking log rotation
* db/QueryBuilder
    - move query builders to base class

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