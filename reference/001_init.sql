-- Accounts
CREATE TABLE Users (
  Id           uniqueidentifier NOT NULL CONSTRAINT PK_Users PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
  Name         nvarchar(100)    NOT NULL,
  Email        nvarchar(320)    COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL CONSTRAINT UQ_Users_Email UNIQUE,
  PasswordHash nvarchar(300)    NOT NULL,
  CreatedAt    datetime2(3)     NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt    datetime2(3)     NOT NULL DEFAULT SYSUTCDATETIME()
);

-- Children & shared access
CREATE TABLE Children (
  Id        uniqueidentifier NOT NULL CONSTRAINT PK_Children PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
  Name      nvarchar(100)    NOT NULL,
  BirthDate date             NULL,
  CreatedBy uniqueidentifier NOT NULL CONSTRAINT FK_Children_CreatedBy REFERENCES Users(Id),
  CreatedAt datetime2(3)     NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt datetime2(3)     NOT NULL DEFAULT SYSUTCDATETIME(),
  DeletedAt datetime2(3)     NULL           -- soft delete
);

-- Many-to-many: any number of caregivers per child, any number of children per user
CREATE TABLE ChildCaregivers (
  ChildId   uniqueidentifier NOT NULL CONSTRAINT FK_ChildCaregivers_ChildId REFERENCES Children(Id) ON DELETE CASCADE,
  UserId    uniqueidentifier NOT NULL CONSTRAINT FK_ChildCaregivers_UserId  REFERENCES Users(Id),
  Role      nvarchar(20)     NOT NULL CONSTRAINT CK_ChildCaregivers_Role CHECK (Role IN ('owner', 'caregiver')),
  AddedBy   uniqueidentifier NULL     CONSTRAINT FK_ChildCaregivers_AddedBy REFERENCES Users(Id),
  CreatedAt datetime2(3)     NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT PK_ChildCaregivers PRIMARY KEY (ChildId, UserId)
);

-- Lookup user's children
CREATE INDEX IX_ChildCaregivers_UserId ON ChildCaregivers (UserId);  -- "my children" lookup

-- Single-use, expiring invite codes
CREATE TABLE Invites (
  Code       nvarchar(12)     NOT NULL CONSTRAINT PK_Invites PRIMARY KEY,
  ChildId    uniqueidentifier NOT NULL CONSTRAINT FK_Invites_ChildId REFERENCES Children(Id) ON DELETE CASCADE,
  Role       nvarchar(20)     NOT NULL DEFAULT 'caregiver' CONSTRAINT CK_Invites_Role CHECK (Role IN ('owner', 'caregiver')),
  CreatedBy  uniqueidentifier NOT NULL CONSTRAINT FK_Invites_CreatedBy REFERENCES Users(Id),
  CreatedAt  datetime2(3)     NOT NULL DEFAULT SYSUTCDATETIME(),
  ExpiresAt  datetime2(3)     NOT NULL,
  AcceptedBy uniqueidentifier NULL CONSTRAINT FK_Invites_AcceptedBy REFERENCES Users(Id),
  AcceptedAt datetime2(3)     NULL,
  RevokedAt  datetime2(3)     NULL,
  CONSTRAINT CK_Invites_Accepted CHECK (
    (AcceptedBy IS NULL AND AcceptedAt IS NULL) OR (AcceptedBy IS NOT NULL AND AcceptedAt IS NOT NULL)
  )
);
CREATE INDEX IX_Invites_ChildId ON Invites (ChildId);

-- Events 
CREATE TABLE EventTypes (
  Name nvarchar(50) NOT NULL CONSTRAINT PK_EventTypes PRIMARY KEY
);

-- Add Event Types
INSERT INTO EventTypes (Name) VALUES ('feeding'), ('diaper');

CREATE TABLE Events (
  Id            uniqueidentifier NOT NULL CONSTRAINT PK_Events PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
  ChildId       uniqueidentifier NOT NULL CONSTRAINT FK_Events_ChildId REFERENCES Children(Id) ON DELETE CASCADE,
  Type          nvarchar(50)     NOT NULL CONSTRAINT FK_Events_Type REFERENCES EventTypes(Name),
  SchemaVersion smallint         NOT NULL DEFAULT 1,
  StartedAt     datetime2(3)     NOT NULL,
  EndedAt       datetime2(3)     NULL,       -- NULL = instant event, or timer still running
  Details       nvarchar(max)    NOT NULL DEFAULT '{}' CONSTRAINT CK_Events_DetailsJson CHECK (ISJSON(Details) = 1),
  Notes         nvarchar(500)    NULL,
  LoggedBy      uniqueidentifier NOT NULL CONSTRAINT FK_Events_LoggedBy  REFERENCES Users(Id),
  UpdatedBy     uniqueidentifier NULL     CONSTRAINT FK_Events_UpdatedBy REFERENCES Users(Id),
  CreatedAt     datetime2(3)     NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt     datetime2(3)     NOT NULL DEFAULT SYSUTCDATETIME(),
  DeletedAt     datetime2(3)     NULL,       -- soft delete
  CONSTRAINT CK_Events_Time CHECK (EndedAt IS NULL OR EndedAt >= StartedAt)
);

-- Timeline: newest first per child, ignoring deleted rows
CREATE INDEX IX_Events_Timeline  ON Events (ChildId, StartedAt DESC) WHERE DeletedAt IS NULL;

-- "Last feeding" / "last diaper" per child
CREATE INDEX IX_Events_ChildType ON Events (ChildId, Type, StartedAt DESC) WHERE DeletedAt IS NULL;