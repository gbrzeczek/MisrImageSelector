namespace MisrImageSelector.Api.Commands;

public record VoteCommand(int ImageId, double LpipsScore);