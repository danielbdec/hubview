-- Setup script for TaskActivities in HubView Database (MSSQL)

CREATE TABLE TaskActivities (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    taskId UNIQUEIDENTIFIER NOT NULL,
    userName NVARCHAR(100) NOT NULL,
    type NVARCHAR(20) NOT NULL CHECK (type IN ('comment', 'history')),
    content NVARCHAR(MAX) NOT NULL,
    createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- Create an index to speed up querying by taskId since we will fetch these often
CREATE NONCLUSTERED INDEX IX_TaskActivities_TaskId ON TaskActivities(taskId);
GO
