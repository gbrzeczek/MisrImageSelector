namespace MisrImageSelector.Api.Persistence;

public class Vote
{
    public int Id { get; set; }
    public required double LpipsScore { get; set; }
    public required string SessionId { get; set; }
    public required int ImageId { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}