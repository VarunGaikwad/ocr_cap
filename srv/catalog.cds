using {cuid} from '@sap/cds/common';

service Document {

    type TJobs : {
        status        : String;
        fileName      : String;
        documentType  : String;
        created       : String;
        clientId      : String;
        templateId    : String;
        languageCodes : array of String;
    };


    function Jobs()                                       returns array of TJobs;
    function Job(ID : UUID)                               returns TJobs;
    function Download(ID : UUID)                          returns LargeBinary;
    action   Upload(content : LargeBinary, name : String) returns Integer;

    @odata.draft.enabled
    entity Dummy : cuid {
        name : String;
    }
}
