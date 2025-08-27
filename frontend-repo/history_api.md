interview-history-controller


GET
/api/interview/history


Parameters
Try it out
No parameters

Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "status": 0,
  "message": "string",
  "result": {
    "totalCount": 0,
    "thisMonthCount": 0,
    "interviews": [
      {
        "interviewUuid": "string",
        "createdAt": "2025-08-08T02:53:22.407Z",
        "finishedAt": "2025-08-08T02:53:22.407Z",
        "enterpriseName": "string",
        "position": "string",
        "questionCount": 0,
        "files": [
          {
            "fileUuid": "string",
            "fileType": "SCRIPT",
            "fileUrl": "string"
          }
        ],
        "interviewType": "TENACITY"
      }
    ]
  }
}
No links

GET
/api/interview/history/{interviewUuid}


Parameters
Try it out
Name	Description
interviewUuid *
string
(path)
interviewUuid
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "status": 0,
  "message": "string",
  "result": {
    "interviewUuid": "string",
    "enterpriseName": "string",
    "position": "string",
    "interviewType": "TENACITY",
    "createdAt": "2025-08-08T02:53:22.408Z",
    "duration": "string",
    "ptTitle": "string",
    "ptSituation": "string",
    "ptFeedBack": [
      {
        "videoUrl": "string",
        "intent": "string",
        "expressions": [
          {
            "second": 0,
            "expression": "string"
          }
        ],
        "transcript": "string",
        "segments": [
          {
            "start": 0,
            "end": 0,
            "text": "string",
            "intent": "string"
          }
        ]
      }
    ],
    "questionCount": 0,
    "questions": [
      {
        "questionNumber": 0,
        "question": "string",
        "feedback": [
          {
            "videoUrl": "string",
            "intent": "string",
            "expressions": [
              {
                "second": 0,
                "expression": "string"
              }
            ],
            "transcript": "string",
            "segments": [
              {
                "start": 0,
                "end": 0,
                "text": "string",
                "intent": "string"
              }
            ]
          }
        ]
      }
    ]
  }
}
No links

DELETE
/api/interview/history/{interviewUuid}


Parameters
Try it out
Name	Description
interviewUuid *
string
(path)
interviewUuid
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "status": 0,
  "message": "string",
  "result": {}
}